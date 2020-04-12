# @iamsquare/ra-data-xmysql
[Xmysql](https://github.com/o1lab/xmysql) data provider for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications on top of REST services.


## Installation

`ra-data-xmysql` is available from `npm`. You can install it using:

```sh
npm install @iamsquare/ra-data-xmysql
```

It can also be installed using `yarn`:
```sh
yarn add @iamsquare/ra-data-xmysql
```


## Usage

First `import` the module in your `App.js` file:
```js
import xmysqlDataProvider from 'ra-data-xmysql';
```
Then pass it to the `Admin`'s `dataProvider` prop:
```js
<Admin dataProvider={xmysqlDataProvider('http://my.api.url/api')} ...>
```

## License

This module is licensed under the [MIT Licence](LICENSE).
