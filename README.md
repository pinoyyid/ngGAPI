## Deprecation Notice

This library has migrated to https://github.com/pinoyyid/ngDrive

This move is to reflect the fact that the power of this library is its focus on Google Drive, including implementing its more complex features (eg. resumable uploads) and dealing with common Drive errors.

For any users of this library who wish to migrate, simply
1. `bower install ngDrive`
2. repoint your script tag to `bower_components/ndDrive/build/module.js`
3. replace `ngm.ngGAPI` with `ngm.ngDrive` in your code

