import { JPEGParser, JPEG } from './src/JPEGParser'

const fileInput = document.getElementById('file')

fileInput.addEventListener('change', e => {
  const fr = new FileReader()
  const file = e.target.files[0]

  fr.addEventListener('loadend', () => {
    console.log(fr.result)

    const jpeg = new JPEG(fr.result)

    console.log(jpeg)
  })

  fr.readAsArrayBuffer(file)
})
