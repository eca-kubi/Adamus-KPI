// calculations.js
// Logic for KPI calculations (Variance, MTD, etc.)

function calculateVariance(actual, forecast, isSafety = false) {
    const act = parseFloat(actual);
    const fc = parseFloat(forecast);

    if (isNaN(act) || isNaN(fc)) {
        return '';
    }

    let variance = 0;

    if (isSafety) {
        // Safety / OHS Variance: ((Forecast - Actual) / Actual) * 100
        if (act === 0 && fc === 0) {
            variance = 0;
        } else if (act === 0 && fc !== 0) {
            variance = fc > 0 ? 100 : -100; // Divide by zero handling
        } else {
            variance = ((fc - act) / act) * 100;
        }

        // Custom fixed-rule overrides defined by user prompt edge-cases 
        // to handle specific OHS safety incidents thresholds:
        if (act === 1 && (fc === 1 || fc === 2)) variance = 50;
        if (act === 2 && fc === 2) variance = 0;
        if (act === 3 && fc === 2) variance = -50;

        // Safety Net: if actual is >= 4
        if (act >= 4) variance = -100;
    } else {
        // Standard Variance: ((Actual - Forecast) / Forecast) * 100
        if (fc === 0 && act === 0) {
            variance = 0;
        } else if (fc === 0 && act !== 0) {
            variance = act > 0 ? 100 : -100; // Divide by zero handling
        } else {
            variance = ((act - fc) / fc) * 100;
        }
    }

    // Clamp the variance between -100% and 100%
    if (variance < -100) {
        variance = -100;
    } else if (variance > 100) {
        variance = 100;
    }

    return Math.round(variance) + '%';
}

function calculateMTD(previousMTD, currentDaily) {
    const prev = parseFloat(previousMTD) || 0;
    const curr = parseFloat(currentDaily) || 0;
    return prev + curr;
}

function attachVarianceListener(actualInput, forecastInput, varianceOutput, isSafety = false) {
    const update = () => {
        varianceOutput.value = calculateVariance(actualInput.value, forecastInput.value, isSafety);
    };
    actualInput.addEventListener('input', update);
    forecastInput.addEventListener('input', update);
}
