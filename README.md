#fingerprintjs

###NOTE: This is a fork of the original [Valve's fingerprintjs](https://github.com/Valve/fingerprintjs) project.

Fast browser fingerprint library. Written in pure JavaScript, no dependencies. 
By default uses [Murmur hashing][murmur] and returns a 32bit integer number.
Hashing function can be easily replaced.

## What is fingerprinting?

Fingerprinting is a technique, outlined in [the research by Electronic Frontier Foundation][research], of
anonymously identifying a web browser with accuracy of up to 94%. 


A browser is queried for its agent string, screen color depth, language,
installed plugins with supported mime types, timezone offset and other capabilities, 
such as local storage and session storage. Then these values are passed through a hashing function
to produce a fingerprint that gives weak guarantees of uniqueness.

No cookies are stored to identify a browser.

It's worth noting that a mobile share of browsers is much more uniform, so fingerprinting should be used
only as a supplementary identifying mechanism there.

## Installation
Just copy the `fingerprint.js` file to your js directory.