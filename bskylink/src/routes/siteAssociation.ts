import {Express} from 'express'

import {AppContext} from '../context.js'

export default function (ctx: AppContext, app: Express) {
  return app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: '72SFN5T3MW.com.taollc.taosocial',
            paths: ['*'],
          },
        ],
      },
      appclips: {
        apps: ['72SFN5T3MW.com.taollc.taosocial.AppClip'],
      },
    })
  })
}
