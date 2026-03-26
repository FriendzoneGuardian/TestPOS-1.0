/**
 * Phase 3.0: Global Philippine Peso formatter.
 * Usage: PH(1500) → "₱1,500.00"
 *        PH(1500, true) → "+₱1,500.00" (signed mode for variance)
 */
function PH(value, signed = false) {
    const num = parseFloat(value) || 0;
    const formatted = '₱' + Math.abs(num).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    if (signed) {
        if (num < 0) return '-' + formatted;
        if (num > 0) return '+' + formatted;
    }
    return (num < 0 ? '-' : '') + formatted;
}
