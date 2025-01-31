export function FetchBase (root) {
  root.setAV = function (root) {
    let apiServer = root.conf.appId.slice(-9) !== '-MdYXbMMI' ? root.conf.serverURL : `https://${root.conf.appId.slice(0, 8).toLowerCase()}.api.lncldglobal.com`
    if (!apiServer) {
      fetch('https://app-router.leancloud.cn/2/route?appId=' + root.conf.appId)
        .then(resp => resp.json())
        .then(({ api_server }) => { // eslint-disable-line
          apiServer = 'https://' + api_server // eslint-disable-line
          try {
            AV.init({
              appId: root.conf.appId,
              appKey: root.conf.appKey,
              apiServer
            })
          } catch (e) {}
          root.v = AV
        })
    } else {
      try {
        AV.init({
          appId: root.conf.appId,
          appKey: root.conf.appKey,
          apiServer
        })
      } catch (e) {}
      root.v = AV
    }
  }
  root.fetchCount = (root) => {
    const query1 = new root.v.Query('Comment')
    query1.equalTo('url', root.C.url)
    const query2 = new root.v.Query('Comment')
    query2.equalTo('url', `${root.C.url}/`)
    const query = AV.Query.or(query1, query2)
    query.notEqualTo('isSpam', true)
    query.count().then((count) => {
      root.el.querySelector('.count').innerHTML = count
    }).catch((ex) => {
      console.error(ex)
      root.el.querySelector('.count').innerHTML = 0
    })
  }
  root.fetchTotalPages = (root, callback) => {
    const cq = root.v.Query.doCloudQuery(`select count(*) from Comment where (rid='' or rid is not exists) and (url='${root.C.url}' or url='${`${root.C.url}/`}') order by -createdAt`)
    cq.then((rets) => {
      callback(Math.ceil(rets.count / root.conf.pageSize))
    }).catch((ex) => {
      console.error(ex)
    })
  }
  root.fetchParentList = (root, pageNum, callback) => {
    const cq = root.v.Query.doCloudQuery(`select nick, comment, link, rid, isSpam, mailMd5, ua ${root.conf.region ? ',log' : ''} from Comment where (rid='' or rid is not exists) and (url='${root.C.url}' or url='${`${root.C.url}/`}') order by -createdAt limit ${(pageNum - 1) * root.conf.pageSize},${root.conf.pageSize}`)
    cq.then((rets) => {
      rets = (rets && rets.results) || []
      callback(rets)
    }).catch((ex) => {
      // console.error(ex)
      root.loading.hide(root.parentCount)
    })
  }
  root.fetchNextList = (root, _id, callback) => {
    const cq = root.v.Query.doCloudQuery(`select nick, comment, link, rid, isSpam, mailMd5, ua ${root.conf.region ? ',log' : ''} from Comment where rid='${_id}' and (url='${root.C.url}' or url='${`${root.C.url}/`}') order by -createdAt`)
    cq.then((rets) => {
      rets = (rets && rets.results) || []
      callback(rets)
    }).catch((ex) => {
      // console.error(ex)
      root.loading.hide(root.parentCount)
    })
  }
  root.fetchNextCount = (root, _id, callback) => {
    const cq = root.v.Query.doCloudQuery(`select count(*) from Comment where rid='${_id}' and (url='${root.C.url}' or url='${`${root.C.url}/`}') order by -createdAt`)
    cq.then((rets) => {
      const { count } = rets
      callback(count)
    }).catch((ex) => {
      console.error(ex)
    })
  }
  root.postComment = (root, callback) => {
    // 声明类型
    const Ct = root.v.Object.extend('Comment')
    // 新建对象
    const comment = new Ct()
    for (const i in root.C) {
      if (root.C.hasOwnProperty(i)) {
        if (i === 'at') continue
        const _v = root.C[i]
        comment.set(i, _v)
      }
    }
    // setting access
    const getAcl = () => {
      const acl = new root.v.ACL()
      acl.setWriteAccess('role:' + root.conf.role, true)
      acl.setPublicReadAccess(true)
      acl.setPublicWriteAccess(false)
      return acl
    }
    comment.setACL(getAcl())
    comment
      .save({ log: window.MV })
      .then((commentItem) => {
        callback(commentItem)
      })
      .catch((ex) => {
        root.submitting.hide()
      })
  }
}
