requests:

getDefNode -> node uri
getNodeInfo -> {this uri, coordinates, connections, imageName}
GET img/[imageName] "fetch(img/imageName)"

node {
	_id;
	name;
	imageName;
	pos;
}

Client-server interface:
[request]: ( [args] ) -> [result]; [cur status]

Nodes:
getNodeReq: ( uri ) -> node; + 
addNodeReq: ( node ) -> uri; +
updateNodeReq: ( uri, node ) -> result; +
delNodeReq: ( uri ) -> result; +

Connections:
connectNodesReq: ( uri1, uri2 ) -> result; +
disconnectNodesReq: ( uri1, uri2 ) -> result; +

Graph info:
getNodeConnectionsReq: ( uri ) -> conA; + 

getNeighboursReq: (uri) -> uriA;
getAllNodesReq: () -> uriA; +
getAllNodesDataReq: () -> nodeA; +
getAllConnectionsReq: () -> conA; +

Def node:
setDefNodeURIReq: ( uri ) -> result; + 
getDefNodeURIReq: () -> uri; +

Support:
ping: (value) -> value; +

image folders:
f{number} - floor {number}
o - outdoor
b - basement
p - programmirovochnaya
ms - main staircase
es - english staircase