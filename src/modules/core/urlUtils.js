module.exports = {
  addTrailingSlash: (url) => `${url}${url[url.length - 1] === '/' ? '' : '/'}`,
}
