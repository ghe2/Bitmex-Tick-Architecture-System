/*global */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Conv = {
    currencyTo2Digits: function(value) {
        return value.toLocaleString("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        });
    },
};
