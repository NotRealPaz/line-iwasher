import * as cheerio from 'cheerio'

export default async () => {
  const url = 'http://www.i-washer.com/sts_moniter.php?site=' + process.env.SITE
  const res = await fetch(url)
  const result = (new TextDecoder('tis-620')).decode(await res.arrayBuffer())
  const $ = cheerio.load(result)

  const elem = $('td').map((i, x) => { return $(x).text() }).get()
  const devices = elem.map(x => {
    if (/ว่าง/g.test(x)) return 'Free'
    if (/กำลังทำงาน/g.test(x)) return 'Using'
    return 'Unknown'
  })
  return devices
}
