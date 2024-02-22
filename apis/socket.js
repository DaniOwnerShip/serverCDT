



// PENDIENTE VALIDACIONES !!

export default function initSocket(serverSocket) {

    const IdocState = {
        required: "required",
        reserved: "reserved",
        released: "released"
    };
    // let IdocReserve = { reqState: IdocState.released, docId: null, userIP: '', userAlias: '' };
    let IdocReserve = { docId: "", userOwner: {}, reqState: IdocState.reserved };
    let usersOn = [];

    const io = serverSocket;

    io.on("connection", (socket) => {

        // const userIP = socket.handshake.address;
        // const userAlias = socket.handshake.query.userAlias;
        const user = {
            IP: socket.handshake.address,
            alias: socket.handshake.query.userAlias,
            socketID: socket.id
        }

        usersOn.push(user);

        io.emit('users', usersOn);                    
        
        socket.emit('connectRes', {
            user: user ,
            message: 'Conexión establecida como:  ' + user.alias + ' [' + user.IP + ']'
        });

        if (usersOn.length >= 1) {
            socket.broadcast.emit("comment", user.alias + ' se ha conectado');
        }

        console.log('usuario conectado', user.socketID, ' IP', user.IP, ' alias', user.alias);


        socket.on('comment', (comment) => {
            io.emit('comment', user.alias + ' -> ' + comment);
        });



        socket.on('reserveReq', (docReserve) => {

            const docName = IdocReserve.docId.split('.')[0];

            console.log('reserveReq', docReserve);
            if (docReserve.reqState === IdocState.required) {

                if (docReserve.docId === IdocReserve.docId) {

                    socket.emit('reserveRes', {
                        IdocReserve: IdocReserve , 
                        message: 'Reserva denegada. El ' + IdocReserve.docId + ' está reservado por: ' + IdocReserve.userOwner.alias + ' [' + IdocReserve.userOwner.IP + ']'
                    });

                    console.log('Reserva denegada. El ' + IdocReserve.docId + ' está reservado por: ' + IdocReserve.userOwner.alias + ' [' + IdocReserve.userOwner.IP + ']');

                    return;
                }

                IdocReserve = {
                    docId: docReserve.docId,
                    userOwner: user,
                    reqState: IdocState.reserved
                };
 
                io.emit('reserveRes', {
                    IdocReserve: IdocReserve , 
                    message: 'Reserva apectada: ' + docName + '. Para: ' + IdocReserve.userOwner.alias + ' [' + IdocReserve.userOwner.IP + ']'
                });

                console.log('Reserva apectada: ' + docName + ' Para: ' + IdocReserve.userOwner.alias + ' [' + IdocReserve.userOwner.IP + ']');

            }
        });





        socket.on('releaseDoc', (docReserve) => {

            if (docReserve.reqState === IdocState.released && IdocReserve.docId === docReserve.docId && IdocReserve.userOwner.IP === user.IP) {

                const docName = IdocReserve.docId.split('.')[0];
 
  
                    IdocReserve.reqState = IdocState.released ;
              

                io.emit('reserveRes', {
                    IdocReserve: IdocReserve , 
                    message: 'Reserva liberada: ' + docName + '. Por: ' + user.alias + ' [' + user.IP + ']'
                });
                IdocReserve = { 
                    docId: "", 
                    userOwner: {}, 
                    reqState: IdocState.released 
                };
                console.log('Reserva liberada: ' + docName + '. Por: ' + user.alias + ' [' + user.IP + ']');


            }

        });



        socket.on("disconnect", () => {

            console.log('disconnect', user.IP);
            console.log('disconnect', usersOn);
            const index = usersOn.findIndex(u => u.IP === user.IP);
            console.log('index', index);

            if (index !== -1) {
                usersOn.splice(index, 1);
                io.emit("comment", user.alias + ' se ha desconectado');
                io.emit('users', usersOn);
                console.log('usuarios conectados', usersOn?.length);
            }

        });







    });

}
