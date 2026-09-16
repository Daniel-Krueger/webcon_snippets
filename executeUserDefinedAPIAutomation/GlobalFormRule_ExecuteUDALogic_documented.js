window.dkr = window.dkr || {};

/**
 * Utility module for executing WEBCON User Defined Automations (UDAs).
 *
 * Intended to be loaded once via a global form rule (InvokeRule), then called from
 * individual HTML fields. Each field passes its own endpoint, request body, and
 * success callback — keeping all logic out of the configuration field.
 *
 * Usage in an HTML field:
 *   InvokeRule(#{BRUX:<ruleId>:ID}#);                        // loads this module
 *   window.dkr.udaExecution.executeUDAAutomation(            // fires the UDA
 *     '/api/udef/db/<dbId>/automation/<automationName>',
 *     { MyParam: GetValue('#{FLD:1234}#') },
 *     function (jsonResponse) { SetValue('#{FLD:5678}#', jsonResponse.Data["MyField"]); }
 *   );
 */
window.dkr.udaExecution = window.dkr.udaExecution || {
  /**
   * Executes a UDA via POST and dispatches the result to the appropriate handler.
   *
   * @param {string}   endpoint             - Relative URL of the UDA endpoint, e.g. '/api/udef/db/1/automation/MyAuto'.
   * @param {object}   body                 - Request payload. Will be serialised to JSON automatically.
   * @param {function} onSuccess            - Called with the parsed response object when the request succeeds (2xx).
   * @param {function} [onCustomErrorHandling] - Optional. Called as (statusCode, jsonResponse) on non-2xx responses.
   *                                           Omit to fall back to {@link defaultErrorHandling}.
   */
  executeUDAAutomation: async function (endpoint, body, onSuccess, onCustomErrorHandling) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const jsonResponse = await response.json();
      if (response.ok) {
        onSuccess(jsonResponse);
      }
      else {
        if (typeof (onCustomErrorHandling) !== "undefined") {
          onCustomErrorHandling(response.status, jsonResponse)
        }
        else {
          window.dkr.udaExecution.defaultErrorHandling(response.status, jsonResponse);
        }
      }
    } catch (error) {
      window.webcon.businessRules.alert(`Error: ${error}`)

    }
  },

  /**
   * Default error handler shown when no custom handler is provided.
   * Displays an alert with the HTTP status code and the `description` field from the response body.
   *
   * @param {number} statusCode    - HTTP status code of the failed response.
   * @param {object} jsonResponse  - Parsed response body; expected to contain a `description` property.
   */
  defaultErrorHandling: function (statusCode, jsonResponse) {
    const description = jsonResponse?.description;
    console.log(`Error body: ${jsonResponse}`)
    window.webcon.businessRules.alert(`Error ${statusCode}: ${description}`)

  },
  /**
   * Reads a WEBCON boolean field usign the built-in functions and converts it to a boolean.
   * WEBCON stores checked as `1` and null/unchecked as `0`; automations expect `true`/`false`.
   *
   * @param  {string}  fieldName - WEBCON field token, e.g. '#{FLD:1234}#'.
   * @returns {boolean}
   */
  GetBoolValue: function (fieldName) {
    if (GetValue(fieldName) == 1) {
      return true
    }
    return false
  },
  /**
   * Normalises a date/time value returned by a UDA.
   * WEBCON represents null date fields as `'0001-01-01T00:00:00'`; this converts that sentinel to `null`
   * so that `SetValue` clears the field instead of writing an invalid date.
   *
   * @param  {string|null} value - Raw date string from `jsonResponse.Data`.
   * @returns {string|null}       - ISO date string, or `null` for empty/null fields.
   */
  ParseDateTimeValue: function (value) {
    if (value == '0001-01-01T00:00:00') {
      return null
    }
    return value
  }
};

console.log("Logic execute automation loaded.")