window.dkr = window.dkr || {};

window.dkr.udaExecution = {
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

  defaultErrorHandling: function (statusCode, jsonResponse) {
    const description = jsonResponse?.description;
    console.log(`Error body: ${jsonResponse}`)
    window.webcon.businessRules.alert(`Error ${statusCode}: ${description}`)
  },

  // Standard GetValue functions returns 1/0 for boolean fields; automations expect true/false.
  getBoolValue: function (fieldName) {
    if (GetValue(fieldName) == 1) {
      return true
    }
    return false
  },

  // WEBCON represents null date fields as '0001-01-01T00:00:00'.
  parseDateTimeValue: function (value) {
    if (value == '0001-01-01T00:00:00') {
      return null
    }
    return value
  }
};

console.log("Logic execute automation loaded.")
