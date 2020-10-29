const protoPath = __dirname + '/proto/link-discoverer.proto'
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const config = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
}

let packageDefinition = protoLoader.loadSync(protoPath, config)
let link_proto = grpc.loadPackageDefinition(packageDefinition).linkDiscoverer

const LinkDiscoverer = require('./link-discoverer')

function discoverLinks(call) {
  const linkDiscoverer = new LinkDiscoverer(call.request.url, call)
  linkDiscoverer.run()
}

function main() {
  let server = new grpc.Server()
  server.addService(link_proto.LinkDiscoverer.service,
    { discoverLinks: discoverLinks }
  )
  server.bindAsync('localhost:8080', grpc.ServerCredentials.createInsecure(), (err, port) => {
  // server.bindAsync(`0.0.0.0:${process.env.PORT || 8080}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    server.start()
    console.log(`Server listening on localhost:${port}`)
  })
}

main()
