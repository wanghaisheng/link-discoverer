const PROTO_PATH = __dirname + '/proto/linkDiscoverer.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


let packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
let employee_proto = grpc.loadPackageDefinition(packageDefinition).linkDiscoverer;


// let { paySalary } = require('./pay_salary.js');
// let { generateReport } = require('./generate_report.js');
const LinkDiscoverer = require('./linkDiscoverer')

function discoverLinks (call) {

  const linkDiscoverer = new LinkDiscoverer(call.request.url, call)
  linkDiscoverer.run()
  // return linkDiscoverer.sitemap
}

function main() {
  let server = new grpc.Server();
  server.addService(employee_proto.LinkDiscoverer.service, 
    { discoverLinks: discoverLinks }
  );
  server.bindAsync('0.0.0.0:4500', grpc.ServerCredentials.createInsecure(), (err, port) => {
    server.start()
  });
}

main();