class BinaryReader {
  constructor(arrayBuffer) {
    this.view = new DataView(arrayBuffer)
    this.byteLength = arrayBuffer.byteLength
    this.pos = 0
    this.littleEndian = false
  }

  tell() {
    return this.pos
  }

  setLittleEndian(littleEndian) {
    this.littleEndian = littleEndian
  }

  peakAt(index = 0, type = 'Uint8') {
    const oldPos = this.pos

    this.pos = index

    const result = this[`get${type}`]()

    this.pos = oldPos

    return result
  }

  peak(type = 'Uint8') {
    const oldPos = this.pos
    const result = this[`get${type}`]()

    this.pos = oldPos

    return result
  }

  seek(pos) {
    const oldPos = this.pos

    this.pos = pos

    return oldPos
  }

  skipEmpty() {
    // This does not work I think
    while (this.peak() === 0 && this.getUint8()) {
      this.pos++
    }
  }

  slice(end) {
    return this.view.buffer.slice(
      this.pos,

      end ? this.pos + end : this.view.buffer.byteLength - 1
    )
  }

  getData(type = 'Uint8') {
    if (this.pos < this.view.byteLength && this.pos > -1) {
      return this.view[`get${type}`](this.pos++)
    }

    return null
  }

  getUint4() {
    const uint8 = this.getUint8()
    const hi = uint8 >>> 4
    const lo = uint8 & 0x0f

    return [hi, lo]
  }

  getUint8() {
    return this.getData()
  }

  getUint16() {
    if (this.littleEndian) {
      const hi = this.getData()
      const lo = this.getData()

      return (lo << 8) | hi
    }

    return (this.getData() << 8) | this.getData()
  }

  getUint32() {
    if (this.littleEndian) {
      const a = this.getData()
      const b = this.getData()
      const c = this.getData()
      const d = this.getData()

      return (d << 24) | (c << 16) | (b << 8) | a
    }

    return (
      (this.getData() << 24) |
      (this.getData() << 16) |
      (this.getData() << 8) |
      this.getData()
    )
  }

  getInt16() {
    let result = this.getUint16()

    if (result & 0x8000) result -= 1 << 16

    return result
  }

  getInt32() {
    let result = this.getUint32()

    if (result & 0x80000000) result -= 1 << 32

    return result
  }

  getS15Fixed16Number() {
    const int32 = this.getInt32()

    return `${(int32 >> 16).toString()}.${(int32 & 0xffff).toString()}`
  }

  getString(length, encoding) {
    if (encoding) {
      const decoder = new TextDecoder(encoding)
      const arr = []

      for (let i = 0; i < length; i++) {
        arr.push(this.getUint8())
      }
      return decoder.decode(new Uint8Array(arr))
    } else {
      let result = ''

      for (let i = 0; i < length; i++) {
        result += String.fromCharCode(this.getUint8())
      }

      return result
    }
  }
}

export default BinaryReader
