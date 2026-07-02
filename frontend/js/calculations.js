// calculations.js
// Logic for KPI calculations (Variance, MTD, etc.)

function calculateVariance(actual, forecast) {
    const act = parseFloat(actual);
    const fc = parseFloat(forecast);

    if (isNaN(act) || isNaN(fc)) {
        return '';
    }

    if (fc === 0) {
        return '0%';
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
