const LONG_TYPES = [7, 12, 16];
const isIE11 = /Trident\/.*rv:11/.test(navigator.userAgent);

function Long(low, high) {
    this.low = low;
    this.high = high;
}

Long.fromBytesLE = function(bytes, i) {
    return new Long(
        bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24),
        bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)
    );
};

Long.prototype.add = function(addend) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    const a48 = this.high >>> 16;
    const a32 = this.high & 0xffff;
    const a16 = this.low >>> 16;
    const a00 = this.low & 0xffff;

    const b48 = addend.high >>> 16;
    const b32 = addend.high & 0xffff;
    const b16 = addend.low >>> 16;
    const b00 = addend.low & 0xffff;

    let c48 = 0,
        c32 = 0,
        c16 = 0,
        c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 + b48;
    c48 &= 0xffff;
    return new Long((c16 << 16) | c00, (c48 << 16) | c32);
};

const ONE = new Long(1, 0);
Long.prototype.compare = function(other) {
    if (this.low === other.low && this.high === other.high) {
        return 0;
    }

    if (this.high < 0 && other.high >= 0) return -1;
    if (this.high >= 0 && this.high < 0) return 1;

    // not add one - Long.negate  this.not().add(Long.ONE)
    // TODO: see negate need to check for min value
    const subtrahend = new Long(~other.low, ~other.high).add(ONE);
    return this.add(subtrahend).high < 0 ? -1 : 1;
};

onmessage = function(e) {
    // msg ready
    if (e.data == "queue") {
        this.postMessage("ready");
    } else {
        const colType = e.data[0];
        const colData = e.data[1];

        // generate [0,1...n] index array
        let indices;

        //console.log(colData, indices);
        if (LONG_TYPES.indexOf(colType) !== -1 && isIE11) {
            const len = colData.length / 8;
            indices = new Array(len);
            for (let i = 0; i < len; i++) {
                indices[i] = i;
            }

            indices.sort(function(x, y) {
                const xVal = Long.fromBytesLE(new Uint8Array(colData.buffer, x * 8, 8));
                const yVal = Long.fromBytesLE(new Uint8Array(colData.buffer, y * 8, 8));
                return xVal.compare(yVal);
            });
        } else {
            indices = new Array(colData.length);
            for (let i = 0; i < colData.length; i++) {
                indices[i] = i;
            }

            indices.sort(function(x, y) {
                return Number(colData[x] - colData[y]);
            });
        }

        postMessage(indices);
    }
};
