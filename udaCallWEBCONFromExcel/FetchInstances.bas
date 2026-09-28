Attribute VB_Name = "FetchInstances"
Option Explicit

Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

'
' Requires: JsonConverter.bas (VBA-JSON by Tim Hall)
' Reference: Tools ? References ? Microsoft Scripting Runtime
'
' Configuration sheet ("configuration") expected layout:
'
'   Rows 1–8 — generic config (col A: label for user, col B: value / formula):
'     B1 = Base URL
'     B2 = Database ID
'     B3 = Get Instances endpoint
'     B4 = Instance Handling endpoint
'     B5 = ID column number          (numeric formula, e.g. =COLUMN(A:A))
'     B6 = Signature column number   (numeric formula, e.g. =COLUMN(K:K))
'     B7 = Action column number      (numeric formula, e.g. =COLUMN(L:L))
'     B8 = Error column number       (numeric formula, e.g. =COLUMN(M:M))
'
'   Get Instances mapping table (col A header must equal GET_TABLE_HEADER):
'     Header row:  col A = "Property"  |  col B = "Column"
'     Data rows:   API property name   |  =DataSheet!X1  (evaluates to that column header text)
'     (ends at first blank col A row)
'
'   Instance Handling mapping table (col A header must equal HANDLE_TABLE_HEADER):
'     Header row:  col A = "Column"  |  col B = "Property"  |  col C = "Target Type"
'     Data rows:   =DataSheet!X1    |  API property name   |  String|Integer|Decimal|Boolean|Date|DateTime
'     (ends at first blank col A row)
'
' The "Column" cells use a reference like =Sheet1!I1. ColumnFromReference reads the referenced
' cell's column position directly, so no header-text lookup is needed at runtime.
'
' Cookies: MSXML2.XMLHTTP shares the WinINet store with IE / Edge IE mode,
'          so an active WEBCON browser session is picked up automatically.
'

' -- Table header labels (adjust to match your config sheet) -------
Private Const GET_TABLE_HEADER    As String = "Get Instance configuration"
Private Const HANDLE_TABLE_HEADER As String = "Instance  handling"

' -- Module-level configuration state -----------------------------
' Populated by LoadConfig; consumed by FetchInstances and ProcessInstances.
' Using module-level variables avoids VBA's restriction that User-Defined
' Types cannot contain Object or dynamic-array members.
Private baseUrl                   As String
Private databaseId                As String
Private idColumn                  As Long
Private signatureColumn           As Long
Private actionColumn              As Long
Private errorColumn               As Long
Private getInstanceEndpoint       As String
Private instanceHandlingEndpoint  As String
Private propertyColumnMap         As Object   ' Scripting.Dictionary: propName ? colNum (Long)
Private fieldMappings             As Object   ' Collection of Scripting.Dictionary {col, prop, type}
Private sessionCookies            As String   ' Cookie header value captured via Login()

' -- Action state --------------------------------------------------

Public Enum InstanceAction
    InstanceActionUnknown = 0
    InstanceActionCreate = 1
    InstanceActionUpdate = 2
End Enum

Private Function ParseAction(value As String) As InstanceAction
    Select Case LCase(Trim(value))
        Case "create": ParseAction = InstanceActionCreate
        Case "update": ParseAction = InstanceActionUpdate
        Case Else:     ParseAction = InstanceActionUnknown
    End Select
End Function

Private Function ActionDoneLabel(action As InstanceAction) As String
    Select Case action
        Case InstanceActionCreate: ActionDoneLabel = "Created"
        Case InstanceActionUpdate: ActionDoneLabel = "Updated"
        Case Else:                 ActionDoneLabel = ""
    End Select
End Function

' -- Configuration loader ------------------------------------------

' Returns the column number for a config cell that contains a reference formula
' like =Sheet1!J1. The column is taken from the referenced cell's position, not
' from its value. Falls back to CLng(.Value) for plain numeric formulas.
Private Function ColumnFromReference(cell As Range) As Long
    Dim formula As String
    formula = cell.formula
    If Left(formula, 1) = "=" Then
        Dim referencedCell As Object
        On Error Resume Next
        Set referencedCell = Application.Evaluate(Mid(formula, 2))
        On Error GoTo 0
        If Not referencedCell Is Nothing Then
            If TypeName(referencedCell) = "Range" Then
                ColumnFromReference = referencedCell.Column
                Exit Function
            End If
        End If
    End If
    ColumnFromReference = CLng(cell.value)
End Function

Private Function LoadConfig() As Boolean
    LoadConfig = False

    Dim configSheet As Worksheet
    On Error Resume Next
    Set configSheet = ThisWorkbook.Worksheets("configuration")
    On Error GoTo 0
    If configSheet Is Nothing Then
        MsgBox "Worksheet ""configuration"" not found.", vbExclamation, "Configuration"
        Exit Function
    End If

    ' Generic config from rows 1–8, col B
    baseUrl = Trim(CStr(configSheet.Cells(1, 2).value))
    databaseId = Trim(CStr(configSheet.Cells(2, 2).value))

    getInstanceEndpoint = Trim(CStr(configSheet.Cells(3, 2).value))
    instanceHandlingEndpoint = Trim(CStr(configSheet.Cells(4, 2).value))

    idColumn = ColumnFromReference(configSheet.Cells(5, 2))
    signatureColumn = ColumnFromReference(configSheet.Cells(6, 2))
    actionColumn = ColumnFromReference(configSheet.Cells(7, 2))
    errorColumn = ColumnFromReference(configSheet.Cells(8, 2))

    If baseUrl = "" Then
        MsgBox "B1 (Base URL) is empty.", vbExclamation, "Configuration"
        Exit Function
    End If
    If databaseId = "" Then
        MsgBox "B2 (Database ID) is empty.", vbExclamation, "Configuration"
        Exit Function
    End If
    If Right(baseUrl, 1) = "/" Then baseUrl = Left(baseUrl, Len(baseUrl) - 1)

    ' Get Instances mapping: API property name ? column number
    Set propertyColumnMap = New Scripting.Dictionary
    Dim row As Long
    row = FindTableHeader(configSheet, GET_TABLE_HEADER, 9)
    If row = 0 Then
        MsgBox "Get Instances table not found. Expected col A header: """ & GET_TABLE_HEADER & """", _
               vbExclamation, "Configuration"
        Exit Function
    End If
    row = row + 2
    Do While configSheet.Cells(row, 1).value <> ""
        Dim propertyName As String: propertyName = Trim(CStr(configSheet.Cells(row, 1).value))
        Dim columnNumber As Long:   columnNumber = ColumnFromReference(configSheet.Cells(row, 2))
        If propertyName <> "" And columnNumber > 0 Then propertyColumnMap(propertyName) = columnNumber
        row = row + 1
    Loop

    ' Instance Handling mapping: column header text, API property name, target type
    row = FindTableHeader(configSheet, HANDLE_TABLE_HEADER, row)
    If row = 0 Then
        MsgBox "Instance Handling table not found. Expected col A header: """ & HANDLE_TABLE_HEADER & """", _
               vbExclamation, "Configuration"
        Exit Function
    End If
    Set fieldMappings = New Collection
    Dim dataRow As Long
    dataRow = row + 2
    Do While configSheet.Cells(dataRow, 1).value <> ""
        Dim entry As Object
        Set entry = New Scripting.Dictionary
        entry("col") = ColumnFromReference(configSheet.Cells(dataRow, 1))
        entry("prop") = Trim(CStr(configSheet.Cells(dataRow, 2).value))
        entry("type") = LCase(Trim(CStr(configSheet.Cells(dataRow, 3).value)))
        fieldMappings.Add entry
        dataRow = dataRow + 1
    Loop

    LoadConfig = True
End Function

' -- Shared helpers ------------------------------------------------

Private Function FindTableHeader(Worksheet As Worksheet, headerText As String, Optional startRow As Long = 1) As Long
    Dim row As Long
    For row = startRow To 500
        If LCase(Trim(CStr(Worksheet.Cells(row, 1).value))) = LCase(headerText) Then
            FindTableHeader = row
            Exit Function
        End If
    Next row
    FindTableHeader = 0
End Function


Private Function SendRequest(method As String, url As String, body As String) As Object
    Dim httpRequest As Object
    Set httpRequest = CreateObject("MSXML2.XMLHTTP.6.0")

    Dim finalUrl As String
    finalUrl = url
    If method = "GET" Then
        ' MSXML2.XMLHTTP uses the WinINet cache shared with IE/Edge-IE-mode.
        ' Creating a new COM object does not bypass it — repeated GET requests
        ' to the same URL return the cached response. Appending a unique
        ' millisecond timestamp forces WinINet to treat each call as a new URL.
        Dim cacheBuster As String
        cacheBuster = CStr((Now - DateSerial(1970, 1, 1)))
        Dim separator As String
        separator = IIf(InStr(url, "?") > 0, "&", "?")
        finalUrl = url & separator & "_=" & cacheBuster
    End If

    httpRequest.Open method, finalUrl, False
    httpRequest.setRequestHeader "Cache-Control", "no-cache"
    httpRequest.setRequestHeader "Pragma", "no-cache"
    If sessionCookies <> "" Then httpRequest.setRequestHeader "Cookie", sessionCookies
    If body <> "" Then httpRequest.setRequestHeader "Content-Type", "application/json"
    httpRequest.Send body
    Set SendRequest = httpRequest
End Function

' -- JSON body builder ---------------------------------------------
' Built manually so decimal values like 23.0 keep their decimal point —
' WEBCON distinguishes integer from decimal at the JSON level.

Private Function BuildBody(dataSheet As Worksheet, rowNumber As Long) As String
    Dim parts() As String
    ReDim parts(0 To fieldMappings.Count - 1)
    Dim fieldCount As Long
    fieldCount = 0

    Dim mapping As Object
    For Each mapping In fieldMappings
        Dim columnNumber As Long
        columnNumber = CLng(mapping("col"))
        If columnNumber = 0 Then GoTo SkipField

        Dim cellValue As Variant
        cellValue = dataSheet.Cells(rowNumber, columnNumber).value
        If IsEmpty(cellValue) Then GoTo SkipField
        If mapping("type") = "string" And Len(Trim(CStr(cellValue))) = 0 Then GoTo SkipField

        Dim jsonToken As String
        jsonToken = ToJsonToken(cellValue, mapping("type"))
        If jsonToken <> "" Then
            parts(fieldCount) = """" & mapping("prop") & """: " & jsonToken
            fieldCount = fieldCount + 1
        End If
SkipField:
    Next mapping

    If fieldCount = 0 Then
        BuildBody = "{}"
    Else
        ReDim Preserve parts(0 To fieldCount - 1)
        BuildBody = "{" & Join(parts, ", ") & "}"
    End If
End Function

Private Function ToJsonToken(value As Variant, targetType As String) As String
    On Error GoTo Fail
    Select Case targetType
        Case "string"
            ToJsonToken = """" & JsonEscape(CStr(value)) & """"
        Case "integer"
            ToJsonToken = CStr(CLng(value))
        Case "decimal"
            Dim decimalValue As Double: decimalValue = CDbl(value)
            Dim decimalText  As String: decimalText = Replace(CStr(decimalValue), ",", ".")
            If InStr(decimalText, ".") = 0 Then decimalText = decimalText & ".0"
            ToJsonToken = decimalText
        Case "boolean"
            ToJsonToken = IIf(CBool(value), "true", "false")
        Case "date"
            ToJsonToken = """" & Format(CDate(value), "yyyy-mm-dd") & "T00:00:00"""
        Case "datetime"
            ToJsonToken = """" & Format(CDate(value), "yyyy-mm-ddThh:mm:ss") & """"
        Case Else
            Select Case VarType(value)
                Case vbBoolean:                      ToJsonToken = IIf(CBool(value), "true", "false")
                Case vbDate:                         ToJsonToken = """" & Format(CDate(value), "yyyy-mm-ddThh:mm:ss") & """"
                Case vbInteger, vbLong, vbByte:      ToJsonToken = CStr(value)
                Case vbSingle, vbDouble, vbCurrency: ToJsonToken = Replace(CStr(CDbl(value)), ",", ".")
                Case Else:                           ToJsonToken = """" & JsonEscape(CStr(value)) & """"
            End Select
    End Select
    Exit Function
Fail:
    ToJsonToken = ""
End Function

Private Function JsonEscape(s As String) As String
    s = Replace(s, "\", "\\")
    s = Replace(s, """", "\""")
    s = Replace(s, Chr(10), "\n")
    s = Replace(s, Chr(13), "\r")
    s = Replace(s, Chr(9), "\t")
    JsonEscape = s
End Function




' -- FetchInstances ------------------------------------------------

Public Sub FetchInstances()
    If Not LoadConfig() Then Exit Sub

    Dim dataSheet As Worksheet
    Set dataSheet = ActiveSheet

    Dim maxColumn As Long
    maxColumn = 0
    Dim propertyName As Variant
    For Each propertyName In propertyColumnMap.Keys
        Dim columnNumber As Long
        columnNumber = CLng(propertyColumnMap(propertyName))
        If columnNumber > maxColumn Then maxColumn = columnNumber
    Next propertyName

    Dim lastRow As Long
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, 1).End(xlUp).row
    If lastRow >= 2 And maxColumn > 0 Then
        dataSheet.Range(dataSheet.Cells(2, 1), dataSheet.Cells(lastRow, maxColumn)).ClearContents
    End If

    Dim httpRequest As Object
    On Error GoTo ConnErr
    Set httpRequest = SendRequest("GET", baseUrl & "/api/udef/db/" & databaseId & getInstanceEndpoint, "")
    On Error GoTo 0

    If httpRequest.Status <> 200 Then
        MsgBox "HTTP " & httpRequest.Status & " " & httpRequest.StatusText & vbLf & Left(httpRequest.ResponseText, 500), _
               vbCritical, "API Error"
        Exit Sub
    End If

    Dim dataArray As Collection
    Set dataArray = JsonConverter.ParseJson(httpRequest.ResponseText)("Data")

    If dataArray.Count = 0 Then
        MsgBox "No items returned.", vbInformation, "Done"
        Exit Sub
    End If

    Dim row As Long
    row = 2
    Dim item As Object
    For Each item In dataArray
        For Each propertyName In propertyColumnMap.Keys
            If item.Exists(propertyName) Then dataSheet.Cells(row, CLng(propertyColumnMap(propertyName))).value = item(propertyName)
        Next propertyName
        row = row + 1
    Next item

    MsgBox dataArray.Count & " row(s) written.", vbInformation, "Done"
    Exit Sub

ConnErr:
    MsgBox "Could not connect." & vbLf & Err.Description, vbCritical, "Connection Error"
End Sub

' -- ProcessInstances ----------------------------------------------

Public Sub ProcessInstancesDemo()
    ProcessInstances 1000
End Sub

Public Sub ProcessInstances(Optional delayMs As Long = 0)
    If Not LoadConfig() Then Exit Sub

    Dim dataSheet As Worksheet
    Set dataSheet = ActiveSheet

    Dim lastRow As Long
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, 1).End(xlUp).row
    If lastRow < 2 Then
        MsgBox "No data rows found.", vbInformation, "Done"
        Exit Sub
    End If

    Application.Interactive = False
    Application.ScreenUpdating = False
    On Error GoTo Cleanup

    Dim successCount As Long
    Dim createCount As Long
    Dim updateCount As Long
    Dim errorCount As Long
    Dim row As Long
    Dim totalRows As Long
    totalRows = lastRow - 1

    For row = 2 To lastRow
        dataSheet.Cells(row, errorColumn).value = ""
        Application.StatusBar = "Processing row " & (row - 1) & " of " & totalRows & _
                                "  |  Created: " & createCount & _
                                "  Updated: " & updateCount & _
                                "  Errors: " & errorCount
        If delayMs > 0 Then Sleep delayMs

        Dim action As InstanceAction
        action = ParseAction(CStr(dataSheet.Cells(row, actionColumn).value))
        If action = InstanceActionUnknown Then GoTo NextRow

        Dim method As String
        Dim url As String
        If action = InstanceActionUpdate Then
            Dim instanceId As String
            instanceId = Trim(CStr(dataSheet.Cells(row, idColumn).value))
            If instanceId = "" Then
                errorCount = errorCount + 1
                dataSheet.Cells(row, errorColumn).value = "Error: ID missing in column " & idColumn
                GoTo NextRow
            End If
            method = "PATCH"
            url = baseUrl & "/api/udef/db/" & databaseId & instanceHandlingEndpoint & "/" & instanceId
        Else
            method = "POST"
            url = baseUrl & "/api/udef/db/" & databaseId & instanceHandlingEndpoint
        End If

        Dim httpRequest As Object
        On Error Resume Next
        Set httpRequest = SendRequest(method, url, BuildBody(dataSheet, row))
        Dim connectionError As String
        connectionError = Err.Description
        On Error GoTo Cleanup

        If connectionError <> "" Then
            errorCount = errorCount + 1
            dataSheet.Cells(row, errorColumn).value = "Error: " & connectionError
        ElseIf httpRequest.Status = 200 Then
            successCount = successCount + 1
            If action = InstanceActionCreate Then
                createCount = createCount + 1
                Dim jsonResponse As Object
                Set jsonResponse = JsonConverter.ParseJson(httpRequest.ResponseText)
                dataSheet.Cells(row, idColumn).value = jsonResponse("Data")("Id")
                dataSheet.Cells(row, signatureColumn).value = jsonResponse("Data")("InstanceNumber")
            ElseIf action = InstanceActionUpdate Then
                updateCount = updateCount + 1
            End If
            dataSheet.Cells(row, actionColumn).value = ActionDoneLabel(action)
        Else
            errorCount = errorCount + 1
            dataSheet.Cells(row, errorColumn).value = "Error: HTTP " & httpRequest.Status & " " & httpRequest.StatusText & " — " & httpRequest.ResponseText
        End If

NextRow:
    Next row

    Application.StatusBar = False
    Application.Interactive = True
    Application.ScreenUpdating = True

    Dim message As String
    message = successCount & " row(s) processed successfully"
    If createCount > 0 Or updateCount > 0 Then
        message = message & " (Created: " & createCount & ", Updated: " & updateCount & ")."
    Else
        message = message & "."
    End If
    If errorCount > 0 Then
        message = message & vbLf & errorCount & " row(s) failed — see column " & errorColumn & " for details."
    End If
    MsgBox message, IIf(errorCount > 0, vbExclamation, vbInformation), "Done"
    Exit Sub

Cleanup:
    Application.StatusBar = False
    Application.Interactive = True
    Application.ScreenUpdating = True
    If Err.Number <> 0 Then
        MsgBox "Unexpected error: " & Err.Description, vbCritical, "Error"
    End If
End Sub




