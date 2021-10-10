'use strict'

/**
 * Module dependencies
 */

// Public node modules.
const fs = require('fs')
const path = require('path')
const qiniu = require('qiniu')

/* eslint-disable no-unused-vars */
module.exports = {
  provider: 'qiniu',
  name: 'qiniu',
  init: (config) => {
    const { accessKey, secretKey, qiniuPrefixPath, selfServerUrl, bucket } = config
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const qiniuConfig = new qiniu.conf.Config()

    return {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          try {
            const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket })
            const uploadToken = putPolicy.uploadToken(mac)

            const formUploader = new qiniu.form_up.FormUploader(qiniuConfig)
            const putExtra = new qiniu.form_up.PutExtra()
            formUploader.put(uploadToken, qiniuPrefixPath + file.hash + file.ext, file.buffer, putExtra, function (
              respErr,
              respBody,
              respInfo
            ) {
              if (respErr) {
                console.error(respErr)
                reject(respErr)
              } else {
                if (respInfo.statusCode === 200) {
                  file.url = selfServerUrl + respBody.key
                  resolve(selfServerUrl + respBody.key)
                } else {
                  reject(respInfo.statusCode)
                }
              }
            })
          } catch (err) {
            console.error(err)
            reject(err)
          }
        })
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig)
          const key = file.url.replace(selfServerUrl, '')
          bucketManager.delete(bucket, key, function (err, respBody, respInfo) {
            if (err) {
              console.error(err)
              reject(undefined)
            } else {
              resolve(respInfo.statusCode === 200)
            }
          })
        })
      }
    }
  }
}
