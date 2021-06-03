import { JPEGParser } from './src/JPEGParser'

const fileInput = document.getElementById('file')

fileInput.addEventListener('change', e => {
  const fr = new FileReader()
  const file = e.target.files[0]

  fr.addEventListener('loadend', () => {
    console.log(fr.result)

    console.log(JPEGParser(fr.result))
  })

  fr.readAsArrayBuffer(file)
})
