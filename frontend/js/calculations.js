// calculations.js
// Logic for KPI calculations (Variance, MTD, etc.)

function calculateVariance(actual, forecast) {
    const act = parseFloat(actual);
    const fc = parseFloat(forecast);

    if (isNaN(act) || isNaN(fc)) {
        return '';
    }

    if (fc === 0) {
        // A 0 forecast makes the variance undefined: report '0%' when there is
        // no actual either, otherwise '-' (not applicable). Mirrors the backend
        // and the stockpile / availability tables.
        return act === 0 ? '0%' : '-';
    }

    const variance = ((act - fc) / fc) * 100;
    return Math.round(variance) + '%';
}

function calculateMTD(previousMTD, currentDaily) {
    const prev = parseFloat(previousMTD) || 0;
    const curr = parseFloat(currentDaily) || 0;
    return prev + curr;
}

function attachVarianceListener(actualInput, forecastInput, varianceOutput) {
    const update = () => {
        varianceOutput.value = calculateVariance(actualInput.value, forecastInput.value);
    };
    actualInput.addEventListener('input', update);
    forecastInput.addEventListener('input', update);
}
