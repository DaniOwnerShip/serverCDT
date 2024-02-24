import docReserve from "../docReserve.json" assert { type: "json" };   


const newDocReserve = { ...docReserve };


// pend. validaciones !!

export default function initSocket(serverSocket) {

    let usersOn = [];

    const io = serverSocket;

    io.on("connection", (socket) => {


        console.log('connection:');

        const userIP = socket.handshake.address;
        const userAlias = socket.handshake.query.userAlias;
        const soketID = socket.id;

        const newUser = {
            IP: userIP,
            alias: userAlias,
            socketID: soketID
        }
 
        usersOn.push({ userIP, userAlias });  

        io.emit('users', usersOn);
 
        socket.emit('connectRes', {
            user: newUser,
            message: 'Conexión establecida como:  ' + newUser.alias + ' [' + newUser.IP + ']'
        });

        if (usersOn.length >= 1) {
            socket.broadcast.emit("comment", newUser.alias + ' se ha conectado');
        }

        console.log('usuario conectado', newUser.alias + ' se ha conectado');

        socket.on('comment', (comment) => {
            io.emit('comment', newUser.alias + ' -> ' + comment);
        });





        socket.on('reserveReq', (ReqDocReserve) => {

            const docName = ReqDocReserve.docId.split('.')[0];

            console.log('reserveReq', ReqDocReserve);

            if (ReqDocReserve.reqState === newDocReserve.reqState.reserved) {

                if (ReqDocReserve.doc.name === newDocReserve.doc.name) {

                    socket.emit('reserveRes', {
                        resDocName: newDocReserve.doc.name,
                        message: 'Reserva denegada. El ' + newDocReserve.doc.name + ' está reservado por: ' + newUser.alias + ' [' + newUser.IP + ']'
                    });

                    console.log('Reserva denegada. El ' + newDocReserve.doc.name + ' está reservado por: ' + newUser.alias + ' [' + newUser.IP + ']');

                    return;
                }
                newDocReserve.doc.name = ReqDocReserve.doc.name;
                newDocReserve.doc.owner = { newUser };
                newDocReserve.doc.reqState = ReqDocReserve.doc.reqState;


                io.emit('reserveRes', {
                    resDocState: newDocReserve.reqState.reserved,
                    message: 'Reserva apectada: ' + docName + '. Para: ' + newDocReserve.doc.owner.userAlias + ' [' + newDocReserve.doc.owner.userIP + ']'
                });

                console.log('Reserva apectada: ' + docName + ' Para: ' + newDocReserve.doc.owner.userAlias + ' [' + newDocReserve.doc.owner.userIP + ']');

            }
        });






        socket.on('releaseDoc', (ReqDocRelease) => {

            if (ReqDocRelease.reqState === newDocReserve.reqState.released &&
                ReqDocRelease.doc.name === newDocReserve.doc.name &&
                ReqDocRelease.user.IP === newDocReserve.doc.owner.IP) {

                const docName = ReqDocRelease.doc.name.split('.')[0];

                newDocReserve.doc.name = "";
                newDocReserve.doc.owner = {};
                newDocReserve.doc.reqState = ReqDocRelease.doc.reqState;

                io.emit('reserveRes', {
                    resDocState: newDocReserve.reqState.released,
                    message: 'Reserva liberada: ' + docName + '. Por: ' + ReqDocRelease.user.alias + ' [' + ReqDocRelease.user.IP + ']'
                });

                console.log('Reserva liberada: ' + docName + '. Por: ' + user.alias + ' [' + user.IP + ']');

            }

        });



        socket.on("disconnect", () => {

            console.log('disconnect', newUser.IP);
            console.log('disconnect', usersOn);
            const index = usersOn.findIndex(u => u.userIP === newUser.IP);
            console.log('index', index);

            if (index !== -1) {
                usersOn.splice(index, 1);
                io.emit("comment", newUser.alias + ' se ha desconectado');
                io.emit('users', usersOn);
                console.log('usuarios conectados', usersOn?.length);
            }

        });







    });

}
