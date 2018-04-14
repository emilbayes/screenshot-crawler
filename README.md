# `screenshot-crawler`

> Screenshot crawler, taking instructions from YAML file and outputting TAP

## Usage

```sh
screenshot-crawler instructions.yml
```

```yml
# instructions.yml
pages:
  # This one takes a simple screenshot
  - title: simple
    url: https://example.com/
  # This one executes custom instructions
  - title: complext
    url: https://example.com/interactive
    # `instructions` is an array of arrays of arrays
    # Each instruction is an array with [method, [args]]
    instructions:
      # [click, [button#private]]
      - - click
        - - button#private
      - - waitFor
        - - 250
      # screenshot takes an optional name arg
      - - screenshot
        - - private
      - - click
        - - button#company
      - - waitFor
        - - 250
      - - screenshot
        - - business
  - title: cart
    url: https://brugtecomputere.dk/quick-order
    instructions:
      # Take an initial screenshot
      - - screenshot
      # Hover
      - - hover
        - - .dropdown
      # Wait for animations
      - - waitFor
        - - 2750
      # Crop a screenshot, named dropdown, to element .dropdown, but expand the
      # crop by [60, 10, 10, 10] around the element
      - - screenshotElement
        - - dropdown
          - .dropdown
          - top: 60
            right: 10
            bottom: 10
            left: 10
      # Clear cookies
      - - clearCookies
```

## API

### Instructions

```yml
- title: frontpage # screenshots will be named `frontpage.png`
  url: https://example.org/ # Load this page
  skip: true # Optional: skip this test. Has highest precedence
  only: true # Optional: only execute tests with the `only` tag
  # Optional instructions
  instructions: # Optional list of instructions. See example above
```

#### `[screenshot, [optionalName]]`
If `optionalName` is given, screenshots will be named
`${title}-${optionalName}.png`, otherwise a simple counter will be used.

#### `[screenshotElement, [optionalName, selector, optionalExpand = {top, right, bottom, left}]]`
Crop a screenshot to a specific element, given by CSS `selector`. Optionally
give a name, yielding screenshots with name `${title}-element-${optionalName}.png`,
otherwise a simple counter will be used. Optionally expand the area around the
screenshot by pixels. Defaults to `{top: 0, right: 0, bottom: 0, left: 0}`.

#### `[clearCookies, []]`
Clear all cookies set so far

### Others
All other instructions are delegated to Puppeterr `page` object:
[class: `Page`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page)

## Install

```sh
npm install -g screenshot-crawler
```

## License

[ISC](LICENSE)
