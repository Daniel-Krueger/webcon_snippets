
// parameterValues is an array of objects with the following structure:
//[
// { id: 109, value: 'test' },
// { id: 109, value: 'test' }
//]
dkr.executeFormRuleWithParameterValues = function (ruleId, parameterValues) {


    // Use the variables instead of fixed numbers
    var ruleFunctionName = "UxRule_FormRuleWithParameter_" + ruleId;
    var ruleFunction = window[ruleFunctionName];
    var paramsObj = {};
    parameterValues.forEach(function (param) {
        paramsObj['param_' + param.id] = param.value;
    });
    return ruleFunction({}, paramsObj);
}