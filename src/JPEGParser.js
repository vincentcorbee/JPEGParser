import BinaryReader from './binary-reader/binary-reader'

// if (module.hot) {
//   module.hot.accept()
// }

const isFrameHeader = seg => {
  const FRAME_HEADERS = ['SOF0', 'SOF2']

  return FRAME_HEADERS.includes(seg)
}

const isScanHeader = seg => {
  const SCAN_HEADER = 'SOS'

  return seg === SCAN_HEADER
}

const RST_MARKER_CODES = {
  0: 0xd0,
  1: 0xd1,
  2: 0xd2,
  3: 0xd3,
  4: 0xd4,
  5: 0xd5,
  6: 0xd6,
  7: 0xd7,
}

const APP_MARKER_CODES = {
  0: 0xe0,
  1: 0xe1,
  2: 0xe2,
  3: 0xe3,
  4: 0xe4,
  5: 0xe5,
  6: 0xe6,
  7: 0xe7,
  8: 0xe8,
  9: 0xe9,
  10: 0xea,
  11: 0xeb,
  12: 0xec,
  13: 0xed,
  14: 0xee,
  15: 0xef,
}

const MARKER_CODES = {
  SOI: 0xd8,
  SOF0: 0xc0,
  SOF2: 0xc2,
  DHT: 0xc4,
  DQT: 0xdb,
  DRI: 0xdd,
  SOS: 0xda,
  DNL: 0xdc,
  RST: RST_MARKER_CODES,
  APP: APP_MARKER_CODES,
  COM: 0xfe,
  EOI: 0xd9,
}

const MARKER_NAMES = {
  0xd8: 'SOI', // Start Of Image
  0xc0: 'SOF0', // Start Of Frame - Baseline DCT - frame header
  0xc2: 'SOF2', // Start Of Frame - Progressive DCT - frame header
  0xc4: 'DHT', // Define Huffman Table
  0xc8: 'JPG',
  0xdb: 'DQT', // Define Quantization Table
  0xdd: 'DRI', // Define Restart Interval
  0xda: 'SOS', // Start Of Scan - scan header
  0xdc: 'DNL', // Define Number of Lines
  // d0 - d7
  0xd0: 'RST', // Restart
  // e0 - ef
  0xe0: 'APP', // Application specific
  0xfe: 'COM', // Comment
  0xd9: 'EOI', // End Of Image
}

const isAPPMarker = code => code >= 0xe0 && code <= 0xef
const isRSTMarker = code => code >= 0xd0 && code <= 0xd7

const getMarkerName = code => {
  let name

  if (isAPPMarker(code)) {
    name = `${MARKER_NAMES[MARKER_CODES.APP[0]]}${MARKER_CODES.APP[0] ^ code}`
  } else if (isRSTMarker(code)) {
    name = `${MARKER_NAMES[MARKER_CODES.RST[0]]}${MARKER_CODES.RST[0] ^ code}`
  } else {
    name = MARKER_NAMES[code]
  }

  // if (name === undefined) {
  //   throw new Error(`Marker name not found for: ${code}`)
  // }

  return name
}

const isMarkerSegment = name => {
  const MARKER_SEGMENTS = ['SOF', 'DHT', 'DQT', 'DRI', 'SOS', 'APP', 'COM', 'DNL', 'JPG']

  /**
   * SOFn - [ Lf, P, Y, X, Nf, Component-specification parameters ]
   *
   * Component-specification parameters - [ Ci, Hi, Vi, Tqi]
   *
   * SOS - [ Ls, Ns, Component-specification parameters, Ss, Se, Ah, Al ]
   *
   * Component-specification parameters - [ Cs, Td, Ta ]
   *
   */

  return !!MARKER_SEGMENTS.find(marker => name.startsWith(marker))
}

const isMarker = code => !!MARKER_NAMES[code]

const isStartOfMarker = (a, b) =>
  a === 0xff && b !== 0xff && b !== 0x0 && getMarkerName(b) !== undefined

const FIELD_TYPES = {
  BYTE: 1,
  ASCII: 2,
  SHORT: 3,
  LONG: 4,
  RATIONAL: 5,
  UNDEFINED: 7,
}

const FIELDS = {
  IMAGE_DESCRIPTION: 'ImageDescription',
  MAKE: 'Make',
  MODEL: 'Model',
  X_RESOLUTION: 'XResolution',
  Y_RESOLUTION: 'YResolution',
  RESOLUTION_UNIT: 'ResolutionUnit',
  SOFTWARE: 'Software',
  DATE_TIME: 'DateTime',
  ARTIST: 'Artist',
  JPEG_INTERCHANGE_FORMAT: 'JPEGInterchangeFormat',
  JPEG_INTERCHANGE_FORMAT_LENGTH: 'JPEGInterchangeFormatLength',
  COMPRESSION: 'Compression',
  YCB_CR_POSITIONING: 'YCbCrPositioning',
  COPYRIGHT: 'Copyright',
  EXIF_IFD_POINTER: 'Exif IFD Pointer',
  GPS_INFO_IFD_POINTER: 'GPSInfo IFD Pointer',
  EXIF_VERSION: 'ExifVersion',
  EXPOSURE_TIME: 'ExposureTime',
  EXPOSURE_PROGRAM: 'ExposureProgram',
  DATE_TIME_ORIGINAL: 'DateTimeOriginal',
  DATE_TIME_DIGITIZED: 'DateTimeDigitized',
  COMPONENTS_CONFIGURATION: 'ComponentsConfiguration',
  APERTURE_VALUE: 'ApertureValue',
  SUBJECT_DISTANCE: 'SubjectDistance',
  METERING_MODE: 'MeteringMode',
  LIGHT_SOURCE: 'LightSource',
  FLASH: 'Flash',
  LENS_MODEL: 'LensModel',
  BODY_SERIAL_NUMBER: 'BodySerialNumber',
  FOCAL_LENGTH: 'FocalLength',
  FLASHPIX_VERSION: 'FlashpixVersion',
  COLOR_SPACE: 'ColorSpace',
  EXPOSURE_MODE: 'ExposureMode',
  WHITE_BALACE: 'WhiteBalace',
  SCENE_CAPTURE_TYPE: 'SceneCaptureType',
  GAIN_CONTROL: 'GainControl',
  CONTRAST: 'Contrast',
  SATURATION: 'Saturation',
  SHARPNESS: 'Sharpness',
  SUBJECT_DISTANCE_RANGE: 'SubjectDistanceRange',
  ISO_SPEED_RATINGS: 'ISOSpeedRatings',
  SPECTRAL_SENSITIVITY: 'SpectralSensitivity',
  GPS_VERSION_ID: 'GPSVersionID',
  GPS_LATITUDE_REF: 'GPSLatitudeRef',
  GPS_LATITUDE: 'GPSLatitude',
  GPS_LONGITUDE_REF: 'GPSLongitudeRef',
  GPS_LONGITUDE: 'GPSLongitude',
  GPS_ALTITUDE_REF: 'GPSAltitudeRef',
  GPS_ALTITUDE: 'GPSAltitude',
}

const TAG_TO_FIELD = {
  0: FIELDS.GPS_VERSION_ID,
  1: FIELDS.GPS_LATITUDE_REF,
  2: FIELDS.GPS_LATITUDE,
  3: FIELDS.GPS_LONGITUDE_REF,
  4: FIELDS.GPS_LONGITUDE,
  5: FIELDS.GPS_ALTITUDE_REF,
  6: FIELDS.GPS_ALTITUDE,
  259: FIELDS.COMPRESSION,
  270: FIELDS.IMAGE_DESCRIPTION,
  271: FIELDS.MAKE,
  272: FIELDS.MODEL,
  282: FIELDS.X_RESOLUTION,
  283: FIELDS.Y_RESOLUTION,
  296: FIELDS.RESOLUTION_UNIT,
  305: FIELDS.SOFTWARE,
  306: FIELDS.DATE_TIME,
  315: FIELDS.ARTIST,
  513: FIELDS.JPEG_INTERCHANGE_FORMAT,
  514: FIELDS.JPEG_INTERCHANGE_FORMAT_LENGTH,
  531: FIELDS.YCB_CR_POSITIONING,
  42036: FIELDS.LENS_MODEL,
  42033: FIELDS.BODY_SERIAL_NUMBER,
  40960: FIELDS.FLASHPIX_VERSION,
  40961: FIELDS.COLOR_SPACE,
  41986: FIELDS.EXPOSURE_MODE,
  41987: FIELDS.WHITE_BALACE,
  41990: FIELDS.SCENE_CAPTURE_TYPE,
  41991: FIELDS.GAIN_CONTROL,
  41992: FIELDS.CONTRAST,
  41993: FIELDS.SATURATION,
  41994: FIELDS.SHARPNESS,
  41996: FIELDS.SUBJECT_DISTANCE_RANGE,
  33432: FIELDS.COPYRIGHT,
  34665: FIELDS.EXIF_IFD_POINTER,
  34853: FIELDS.GPS_INFO_IFD_POINTER,
  36864: FIELDS.EXIF_VERSION,
  33434: FIELDS.EXPOSURE_TIME,
  34850: FIELDS.EXPOSURE_PROGRAM,
  34855: FIELDS.ISO_SPEED_RATINGS,
  34852: FIELDS.SPECTRAL_SENSITIVITY,
  36867: FIELDS.DATE_TIME_ORIGINAL,
  36868: FIELDS.DATE_TIME_DIGITIZED,
  37121: FIELDS.COMPONENTS_CONFIGURATION,
  37378: FIELDS.APERTURE_VALUE,
  37382: FIELDS.SUBJECT_DISTANCE,
  37383: FIELDS.METERING_MODE,
  37384: FIELDS.LIGHT_SOURCE,
  37385: FIELDS.FLASH,
  37386: FIELDS.FOCAL_LENGTH,
}

const DATA_SETS = {
  '1:0': {
    name: 'EnvelopeRecordVersion',
    value: br => br.getInt16(),
  },
  '1:5': {
    name: 'Destination',
  },
  '1:20': {
    name: 'FileFormat',
    value: br => br.getInt16(),
  },
  '1:22': {
    name: 'FileVersion',
    value: br => br.getInt16(),
  },
  '1:60': {
    name: 'EnvelopePriority',
    value: br => br.getUint8(),
  },
  '1:90': {
    name: 'CodedCharacterSet',
    value: br => `${br.getString(1, 'utf-16')}${br.getString(1)}${br.getString(1)}`,
  },
  '2:0': {
    name: 'ApplicationRecordVersion',
    value: br => br.getUint16(),
  },
  '2:5': {
    name: 'ObjectName',
  },
}

const getValue = (binaryReader, IFDEntry, startOffset) => {
  const { valueOffset, fieldType, count } = IFDEntry

  switch (fieldType) {
    case FIELD_TYPES.ASCII:
      // Value is stored from offset
      if (count > 4) {
        binaryReader.seek(startOffset + valueOffset)

        return binaryReader.getString(count, 'utf-8')
      } else {
        binaryReader.seek(binaryReader.tell() - 4)

        return binaryReader.getString(count, 'utf-8')
      }
    case FIELD_TYPES.BYTE:
    case FIELD_TYPES.SHORT:
    case FIELD_TYPES.LONG:
      return valueOffset
    case FIELD_TYPES.RATIONAL:
      binaryReader.seek(startOffset + valueOffset)

      return [binaryReader.getUint32(), binaryReader.getUint32()]
    default:
      return valueOffset
  }
}

const getIFDEntryValue = (IFDEntry, startOffset, binaryReader) => {
  const { fieldName, count } = IFDEntry

  switch (fieldName) {
    case FIELDS.EXIF_IFD_POINTER:
    case FIELDS.GPS_INFO_IFD_POINTER:
      return getIFD(
        binaryReader,
        startOffset,
        getValue(binaryReader, IFDEntry, startOffset)
      )
    case FIELDS.EXIF_VERSION:
      const oldPos = binaryReader.tell()

      binaryReader.seek(binaryReader.tell() - 4)

      const value = binaryReader.getString(count, 'utf-8')

      binaryReader.seek(oldPos)

      return value
    default:
      return getValue(binaryReader, IFDEntry, startOffset)
  }
}

const getIFD = (binaryReader, startOffset, offset) => {
  binaryReader.seek(startOffset + offset)

  const IFD = {}
  const numOfEntries = binaryReader.getUint16()
  const entries = []

  let i = 0

  while (i < numOfEntries) {
    const tag = binaryReader.getUint16()
    const fieldType = binaryReader.getUint16()
    const count = binaryReader.getUint32()
    const valueOffset = binaryReader.getUint32()

    const oldPos = binaryReader.tell()
    const fieldName = TAG_TO_FIELD[tag]

    const IFDEntry = {
      fieldName,
      fieldType,
      count,
      value: undefined,
      tag,
      valueOffset,
    }

    IFDEntry.value = getIFDEntryValue(IFDEntry, startOffset, binaryReader)

    binaryReader.seek(oldPos)

    entries.push(IFDEntry)

    i++
  }

  IFD.numOfEntries = numOfEntries
  IFD.entries = entries
  IFD.nextIFDOffset = binaryReader.getUint32()

  return IFD
}

const isXmp = binaryReader => {
  let xmp = binaryReader.getString(29)

  if (xmp === 'http://ns.adobe.com/xap/1.0/\0') {
    return true
  }

  binaryReader.seek(binaryReader.tell() - 29)

  return false
}

const isICCProfile = binaryReader => {
  let exif = binaryReader.getString(12)

  if (exif === 'ICC_PROFILE\0') {
    return true
  }

  binaryReader.seek(binaryReader.tell() - 12)

  return false
}

const isExif = binaryReader => {
  let exif = binaryReader.getString(6)

  if (exif === 'Exif\0\0') {
    return true
  }

  binaryReader.seek(binaryReader.tell() - 6)

  return false
}

const getExif = arrayBuffer => {
  const binaryReader = new BinaryReader(arrayBuffer)
  const startOffset = binaryReader.tell()
  const exif = {
    header: {},
    IFDs: [],
    thumbnail: undefined,
  }

  // Tiff header
  // The ByteOrder, MM is big-endian, II is little-endian
  const byteOrder = binaryReader.getString(2)

  if (byteOrder === 'II') {
    binaryReader.setLittleEndian(true)
  }

  // A constant 42
  const number = binaryReader.getUint16()

  if (number !== 42) {
    throw new Error(`Wrong constant number in Tiff header: ${number}`)
  }

  // Offset to 1st IFD, should be 8
  const offset = binaryReader.getUint32()

  exif.header = {
    byteOrder,
    number,
    offset,
  }

  let IFD = getIFD(binaryReader, startOffset, offset)

  exif.IFDs.push(IFD)

  // Next IFD when offset is not 0

  while (IFD.nextIFDOffset !== 0) {
    IFD = getIFD(binaryReader, startOffset, IFD.nextIFDOffset)

    exif.IFDs.push(IFD)
  }

  if (exif.IFDs[1]) {
    const [offset, length] = exif.IFDs[1].entries.filter(
      entry =>
        entry.fieldName === 'JPEGInterchangeFormat' ||
        entry.fieldName === 'JPEGInterchangeFormatLength'
    )

    binaryReader.seek(offset.value)

    exif.thumbnail = JPEGParser(binaryReader.slice(length.value))
  }

  return exif
}

const getDataDataSet = (recordNumber, dataSetNumber, br, length) => {
  const dataSet = DATA_SETS[`${recordNumber}:${dataSetNumber}`]

  if (dataSet) {
    return dataSet.value ? dataSet.value(br, length) : br.getString(length)
  }

  return br.getString(length)
}

const PROFILE_CLASSES = {
  0x73636e72: 'scnr',
  0x6d6e7472: 'mntr',
  0x70727472: 'prtr',
  0x6c696e6b: 'link',
  0x73706163: 'spac',
  0x61627374: 'abst',
  0x6e6d636c: 'nmc',
}

const DATA_COLOR_SPACE_SIGNATURES = {
  0x58595a20: 'XYZ',
  0x4c616220: 'Lab',
  0x4c757620: 'Luv',
  0x59436272: 'YCbr',
  0x59787920: 'Yxy',
  0x52474220: 'RGB',
}

const DATA_COLOR_SPACE_SIGNATURES_TYPES = {
  XYZ: {
    PCS: 'PCSXYZ',
    nCIE: 'nCIEXYZ',
  },
  Lab: {
    PCS: 'PCSLAB',
    nCIE: 'CIELAB',
  },
}

const PRIMARY_PLATFORMS = {
  0x4150504c: 'APPL',
  0x4d534654: 'MSFT',
  0x53474920: 'SGI',
  0x53554e57: 'SUNW',
}

export const JPEGParser = arrayBuffer => {
  const binaryReader = new BinaryReader(arrayBuffer)
  let marker
  let segments = []
  let segment

  while ((marker = binaryReader.getUint8()) !== null) {
    if (isStartOfMarker(marker, binaryReader.peak())) {
      marker = binaryReader.getUint8()

      const name = getMarkerName(marker)

      segment = [name]
      segments.push(segment)

      if (isMarkerSegment(name)) {
        if (isFrameHeader(name)) {
          const Lf = binaryReader.getUint16()
          const P = binaryReader.getUint8()
          const Y = binaryReader.getUint16()
          const X = binaryReader.getUint16()
          const Nf = binaryReader.getUint8()

          segment.push(Lf, P, Y, X, Nf)

          let i = 0

          while (i < Nf) {
            const C = binaryReader.getUint8()
            const [H, V] = binaryReader.getUint4()
            const Tq = binaryReader.getUint8()

            segment.push([C, H, V, Tq])

            i++
          }
        } else if (isScanHeader(name)) {
          const Ls = binaryReader.getUint16()
          const Ns = binaryReader.getUint8()

          let i = 0

          segment.push(Ls, Ns)

          while (i < Ns) {
            const Cs = binaryReader.getUint8()
            const [Td, Ta] = binaryReader.getUint4()

            segment.push([Cs, Td, Ta])

            i++
          }

          const Ss = binaryReader.getUint8()
          const Se = binaryReader.getUint8()
          const [Ah, Al] = binaryReader.getUint4()

          segment.push(Ss, Se, Ah, Al)
        } else if (isAPPMarker(marker)) {
          const Lp = binaryReader.getUint16()

          segment.push(Lp)

          if (MARKER_CODES.APP[0] === marker) {
            const identifier = binaryReader.getString(4)

            binaryReader.skipEmpty()

            if (identifier === 'JFIF') {
              const majorVersion = binaryReader.getUint8()
              const minorVersion = binaryReader.getUint8()
              const units = binaryReader.getUint8()
              const xdensity = binaryReader.getUint16()
              const ydensity = binaryReader.getUint16()
              const xthumbnail = binaryReader.getUint8()
              const ythumbnail = binaryReader.getUint8()
              const thumbnailDataLength = xthumbnail * ythumbnail
              const JFIF = {
                identifier,
                majorVersion,
                minorVersion,
                unit:
                  units === 0
                    ? 'aspect ratio'
                    : units === 1
                    ? 'dots per inch'
                    : 'dots per cm',
                xdensity,
                ydensity,
                xthumbnail,
                ythumbnail,
              }

              if (thumbnailDataLength > 0) {
                JFIF.thumbnailData = binaryReader.slice(3 * thumbnailDataLength)
              }

              segment.push(JFIF)
            } else if (identifier === 'JFXX') {
              // JFIF with extension
            }
          } else if (MARKER_CODES.APP[1] === marker) {
            if (isExif(binaryReader)) {
              const startPos = binaryReader.tell() - 6
              const exif = getExif(binaryReader.slice(Lp - 2))

              segment.push(exif)

              // Jump over exif data
              binaryReader.seek(startPos + Lp - 2)
            } else if (isXmp(binaryReader)) {
              const xmp = binaryReader.getString(Lp - 2 - 29, 'utf-8')

              segment.push({
                type: 'xmp',
                xml: new DOMParser().parseFromString(xmp, 'application/xml'),
              })
            }
          } else {
            if (MARKER_CODES.APP[2] === marker) {
              if (isICCProfile(binaryReader)) {
                const br = new BinaryReader(binaryReader.slice(Lp - 2))

                const sequenceNumber = br.getUint8()
                const numberOfChunks = br.getUint8()

                // Header 128 bytes long
                const profileSize = br.getUint32()
                const preferredCMMType = br.getString(4)
                const profileVersionNumber = `${br.getUint8()}.${br.getUint4().join('.')}`

                br.seek(br.tell() + 2)

                const profileDeviceClass = PROFILE_CLASSES[br.getUint32()]
                const colorSpaceOfData = DATA_COLOR_SPACE_SIGNATURES[br.getUint32()]
                const pcs =
                  DATA_COLOR_SPACE_SIGNATURES_TYPES[
                    DATA_COLOR_SPACE_SIGNATURES[br.getUint32()]
                  ].PCS
                const dateAndTime = new Date(
                  Date.UTC(
                    br.getUint16(),
                    br.getUint16(),
                    br.getUint16(),
                    br.getUint16(),
                    br.getUint16(),
                    br.getUint16()
                  )
                )
                const profileFileSignature = br.getString(4)
                const primaryPlatform = PRIMARY_PLATFORMS[br.getUint32()]

                const profileFlagsData = br.getUint32()
                const profileFlags = [profileFlagsData & 1, (profileFlagsData >>> 1) & 1]
                const deviceManufacturer = br.getString(4)
                const deviceModel = br.getUint32()

                br.getUint32()

                const deviceAttributeData = br.getUint32()
                const deviceAttribute = [
                  deviceAttributeData & 1,
                  (deviceAttributeData >>> 1) & 1,
                  (deviceAttributeData >>> 2) & 1,
                  (deviceAttributeData >>> 3) & 1,
                ]
                const renderingIntent = br.getUint32()
                const PCSIlluminant = [
                  br.getS15Fixed16Number(),
                  br.getS15Fixed16Number(),
                  br.getS15Fixed16Number(),
                ]
                const profileCreator = br.getUint32()
                const profileId = br.slice(16)

                br.seek(br.tell() + 16)

                // reserved field
                br.seek(br.tell() + 28)

                const header = {
                  profileSize,
                  preferredCMMType,
                  profileVersionNumber,
                  profileDeviceClass,
                  colorSpaceOfData,
                  pcs,
                  dateAndTime,
                  profileFileSignature,
                  primaryPlatform,
                  profileFlags,
                  deviceManufacturer,
                  deviceModel,
                  deviceAttribute,
                  renderingIntent,
                  PCSIlluminant,
                  profileCreator,
                  profileId,
                }

                // Tag table
                let tagCount = br.getUint32()
                const tagTable = {
                  tagCount,
                  tags: [],
                }

                while (tagCount > 0) {
                  const tagSignature = br.getString(4)
                  const tagOffset = br.getUint32()
                  const tagSize = br.getUint32()
                  const lastOffset = br.tell()

                  br.seek(tagOffset)

                  br.skipEmpty()

                  const tagData = br.getString(4)

                  console.log(tagSignature, tagOffset, tagSize, lastOffset)

                  tagTable.tags.push({ [tagSignature]: tagData })

                  br.seek(lastOffset)

                  tagCount--
                }

                console.log(
                  'ICC_PROFILE',
                  sequenceNumber,
                  numberOfChunks,
                  header,
                  tagTable
                )
              }
            }

            if (MARKER_CODES.APP[13] === marker) {
              const br = new BinaryReader(binaryReader.slice(Lp - 2))
              const identifier = br.getString(14)

              if (identifier === 'Photoshop 3.0\0') {
                const type = br.getString(4)
                const id = br.getUint16()
                const resourceName = br.getString(br.getUint8())

                // Skip pad bytes
                br.skipEmpty()

                const length = br.getUint32()
                const startOffset = br.tell()

                const photoshopResource = {
                  identifier,
                  type,
                  id,
                  resourceName,
                  length,
                  startOffset,
                  datasets: [],
                }

                while (startOffset + length > br.tell()) {
                  // Skip pad byte
                  br.skipEmpty()

                  // Standard dataset
                  const tagMarker = br.getUint8()
                  const recordNumber = br.getUint8()
                  const dataSetNumber = br.getUint8()
                  const dataLength = br.getUint16()
                  const data = getDataDataSet(recordNumber, dataSetNumber, br, dataLength)

                  photoshopResource.datasets.push({
                    tagMarker,
                    recordNumber,
                    dataSetNumber,
                    dataLength,
                    data,
                  })
                }

                segment.push(photoshopResource)
              }
            } else {
              const Ap = []
              let ap = 0

              while (ap < Lp - 2) {
                Ap.push(binaryReader.getUint8())
                ap++
              }

              segment.push(Ap)
              console.log(Ap.map(code => String.fromCharCode(code)).join(''))
            }
          }

          // binaryReader.peak().toString(16),
          // binaryReader.peakAt(binaryReader.tell() + 1).toString(16)
        } else {
          switch (marker) {
            case MARKER_CODES.DHT:
              const Lh = binaryReader.getUint16()
              const [Tc, Th] = binaryReader.getUint4()
              const L = []
              const V = []
              const length = 16

              let l = 0
              let v = 0

              while (l < length) {
                L.push(binaryReader.getUint8())

                l++
              }

              while (v < length) {
                let jL = L[v]
                let j = 0
                const vj = []

                while (j < jL) {
                  vj.push(binaryReader.getUint8())

                  j++
                }

                V.push(vj)

                v++
              }

              segment.push(Lh, Tc, Th, L, V)

              break
            case MARKER_CODES.DQT:
              const Lq = binaryReader.getUint16()
              const [Pq, Tq] = binaryReader.getUint4()
              const elementLength = 64
              const type = Pq === 0 ? `getUint8` : `getUint16`
              const Q = []

              let q = 0

              while (q < elementLength) {
                Q.push(binaryReader[type]())

                q++
              }

              segment.push(Lq, Pq, Tq, Q)

              break
            default:
              console.log(name)
          }
        }
      }
    } else {
      // Stray bytes
      // console.log('++++')
      // console.log(marker.toString(16))
    }
  }

  return segments
}
