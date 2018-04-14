#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml')
var headless = require('puppeteer')
var devices = require('puppeteer/DeviceDescriptors')

var instructionsPath = path.join(process.cwd(), process.argv[2])
var outputDir = process.cwd()

var instructions = yaml.safeLoad(fs.readFileSync(instructionsPath, 'utf8'));

async function main () {
  console.log('TAP version 13')
  var browser = await headless.launch()
  var tab = await browser.newPage()

  var groups = instructions.pages.reduce(function (groups, page) {
    if (page.skip === true) groups.skip.push(page)
    else if (page.only === true) groups.only.push(page)
    else groups.notag.push(page)

    return groups
  }, {only: [], notag: [], skip: []})

  var pages = groups.only.length ? groups.only : groups.notag
  var t = 1

  console.log(`1..${pages.length + pages.reduce((s, p) => s + (p.instructions ? p.instructions.length : 2), 0)}`)

  for(var page of pages) {
    console.log(`# ${page.title}`)
    try {
      await tab.goto(page.url)
      await tab.setViewport({
        'width': 1280,
        'height': 1024,
        'deviceScaleFactor': 2,
        'isMobile': false,
        'hasTouch': false,
        'isLandscape': false
      })
      console.log(`ok ${t++} goto (${page.url})`)
    } catch (ex) {
      console.log(`not ok ${t++} goto (${page.url})`)
      reportError(ex)
    }
    if (!page.instructions) {
      try {
        await tab.screenshot({path: path.join(outputDir, `${page.title}.png`), fullPage: true})
        console.log(`ok ${t++} screenshot (${page.title}.png)`)
      } catch (ex) {
        console.log(`not ok ${t++} screenshot (${page.title}.png)`)
        reportError(ex)
      }
    }
    else {
      var np = 0
      var ne = 0
      var name = null
      for (var [method, args] of page.instructions) {
        switch (method) {
          case 'screenshot':
            var name = args && args[0]
            var filename = `${page.title}-${name || np++}.png`
            try {
              await tab.screenshot({path: path.join(outputDir, filename), fullPage: true})
              console.log(`ok ${t++} screenshot (${filename})`)
            } catch (ex) {
              console.log(`not ok ${t++} screenshot (${filename})`)
              reportError(ex)
            }

            break
          case 'screenshotElement':
            try {
              var clip = await tab.evaluate((selector, expand) => {
                if (expand == null) expand = {top: 0, right: 0, bottom: 0, left: 0}
                var rect = document.querySelector(selector).getBoundingClientRect()
                return {
                  x: rect.x - expand.left,
                  y: rect.y - expand.top,
                  width: rect.width + expand.left + expand.right,
                  height: rect.height + expand.top + expand.bottom
                }
              }, ...args.slice(1))
              var name = args && args[0]
              var filename = `${page.title}-element-${name || ne++}.png`
              await tab.screenshot({path: path.join(outputDir, filename), clip})
              console.log(`ok ${t++} screenshotElement '${args[1]}' (${filename})`)
            } catch (ex) {
              console.log(`not ok ${t++} screenshotElement '${args[1]}' (${filename})`)
              reportError(ex)
            }
            break
          case 'clearCookies':
            try {
              var cookies = await tab.cookies()
              if (cookies.length) await tab.deleteCookie(...cookies.map(c => ({name: c.name})))
              console.log(`ok ${t++} clearCookies (${cookies.length})`)
            }
            catch (ex) {
              console.log(`not ok ${t++} clearCookies (0)`)
              reportError(ex)
            }
            break
          default:
            try {
              await tab[method](...args)
              console.log(`ok ${t++} ${method} (args = ${JSON.stringify(args)})`)
            } catch (ex) {
              console.log(`not ok ${t++} ${method} (args = ${JSON.stringify(args)})`)
              reportError(ex)
            }
            break
        }
      }
    }
  }

  await browser.close()
}

(async _ => main())()


function reportError(ex) {
  var output = ''
  var outer = '  '
  var inner = outer + '  '
  output += outer + '---\n'
  output += inner + 'stack: |-\n'

  var lines = String(ex.stack).split('\n')
  for (var i = 0; i < lines.length; i++) {
    output += inner + '  ' + lines[i] + '\n'
  }
  output += outer + '...\n';

  console.log(output)
}
