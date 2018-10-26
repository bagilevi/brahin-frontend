console.log('backend-storage module loaded');

define(['jquery'], ($) => ((Brahin) => {
  class BackendStrategy {

    /**
     * adapter - the PouchDB adapter – 'idb', 'memory'
     * name
     */
    constructor(opts = {}) {
    }

    save(resource, updatedAttributes) {
      const data = _.assign({ authenticity_token: authenticityToken }, updatedAttributes)

      if (!resource.url && !resource.path) {
        console.log('resource:', resource)
        throw new Error('backend-storage requires a `url` or `path` attribute to save a resource')
      }
      const requestUrl = normalizeUrl(resource.url || resource.path)

      return new Promise((resolve, reject) => {
        $.ajax({
          url: requestUrl,
          method: 'patch',
          data: data,
          success: () => {
            console.log('saved successfully');
            resolve();
          },
          error: (err) => {
            console.error('error while saving', err);
            Brahin.showError(`Error while saving ${resource.path}`)
            reject(err);
          },
        })
      })
    }

    load(params) {
      const { url } = params
      if (!url) {
        console.log('params:', params)
        throw new Error('backend-storage requires a `url` param to load a resource')
      }

      // /    => /home.json
      // /etc => /etc.json
      const requestUrl = normalizeUrl(url)

      return new Promise((resolve, reject) => {
        fetch(requestUrl, { credentials: 'same-origin' })
          .then(response => {
            if (response.status !== 200) {
              const errorMessage = `Request to ${requestUrl} returned HTTP ${response.status}`
              console.error(errorMessage, response)
              response.text()
                .then(text => {
                  try {
                    const err = JSON.parse(text)
                    reject(err)
                  } catch {
                    reject(errorMessage)
                  }
                })
                .catch(err => {
                  reject(errorMessage)
                })
              return
            }
            console.log('got response', response)
            response.text()
              .then(text => {
                console.log('response body', text)
                const resource = JSON.parse(text)
                resource.url = url
                console.log('Resource fetch successful', resource)
                resolve(resource)
              })
              .catch(err => {
                const errorMessage = `Error decoding response from ${requestUrl}`
                console.error(errorMessage, err)
                reject(errorMessage)
              })
          })
          .catch(err => {
            const errorMessage = `Error fetching ${url}`
            console.error(errorMessage, err)
            reject(errorMessage)
          })
      })
    }

    create(resource) {
      const { url, title } = resource
      return new Promise((resolve, reject) => {
        $.ajax({
          method: 'post',
          url: url + '.json',
          data: { title: title, authenticity_token: authenticityToken },
          dataType: 'json',
          success: (resource) => {
            resolve(resource);
          },
          error: (err) => {
            // console.error('$.ajax error', err);
            logError({
              error: 'Could not create new resource',
              params: { url, title },
              reason: '$.ajax error',
              original: err
            }, reject)
          }
        })
      })
    }

    saveFile(file) {
      console.log('storage.saveFile', file)
      return new Promise((resolve, reject) => {
        var formData = new FormData()
        formData.append('upload', file)
        $.ajax({
          method: 'post',
          url: '/_blobs',
          data: formData,
          dataType: 'json',
          cache: false,
          contentType: false,
          processData: false,
          success: (data) => {
            console.log('Upload succeeded', data)
            resolve(data)
          },
          error: function(err) {
            console.error('Failed to upload', err)
            reject({ error: 'upload failed', reason: err })
          }
        });
      })
    }
  }

  function normalizeUrl(url) {
    return url.replace(/^(https?:\/\/[^\/]+)?\/$/, '$1/home') + '.json'
  }

  return BackendStrategy
}))
