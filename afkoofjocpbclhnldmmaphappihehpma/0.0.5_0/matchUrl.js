let apis = []
async function getMatchedRequest(conditionAPis) {  
  if(conditionAPis){
    apis = conditionAPis
  }
  const requests = []
  let timer = null
  return await new Promise((resolve) => {

    const checkMatchedUrl = () =>{      
      for(let i=0; i < apis.length; i++){        
        const api = apis[i]
        for(let j= 0 ; j < headerPool.length ; j++){          
          const header = headerPool[j]
          const body = bodyPool.find(r => r.requestId === header.requestId)  
          if(body && checkMatchedRequest(api.intercept, header, body)){            
            requests[i] = {
              header,
              body
            }
          }  
        }                      
      }
      if(requests.filter(v=> !!v).length === apis.length){
        resolve(requests)
      }else{
        if(timer){
          clearTimeout(timer)
        }
        timer = setTimeout(checkMatchedUrl, 200)
      }
    }
    checkMatchedUrl()
  }) 
}