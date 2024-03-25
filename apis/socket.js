



// pend. validaciones 

export default function initSocket(serverSocket) {

    let usersOn = [];

    let docReservesStack = [];

    const comment = {
        user: "",
        msg: ""
    }

    const io = serverSocket;

    io.on("connection", (socket) => {

        console.log('connection:');

        const userIP = socket.handshake.address;
        const userAlias = socket.handshake.query.userAlias;
        const socketID = socket.id;

        const user = {
            IP: userIP,
            alias: userAlias,
            socketID: socketID,
            reserveIndex: -1
        }

        usersOn.push({ userIP, userAlias });

        io.emit('usersOn', usersOn);

        console.log('usersOn:', usersOn); 
        console.log('usuarios conectados', usersOn.length);


        if (usersOn.length > 1) {
            comment.user = user.alias;
            comment.msg = 'Conectado';
            socket.broadcast.emit("comment", comment);
            // socket.broadcast.emit('usersOn', usersOn);
        }

        console.log('usuario ', user.alias + ' se ha conectado');


        socket.on('userReq', () => { 
            io.emit('usersOn', usersOn);
        });

        socket.on('comment', (comment) => { 
            io.emit('comment', { ...comment, user: user.alias });
        });


        socket.on('docReserveReq', (_docName) => {

            const indexReserve = docReservesStack?.findIndex(reserve => reserve.docName === _docName);

            if (indexReserve !== -1) {
                const reserve = docReservesStack[indexReserve];
                socket.emit('docReserveRes', {
                    succes: false,
                    message: 'Reserva denegada. El ' + reserve.docName + ' está reservado por: ' + reserve.owner.alias
                });
                console.log('Reserva denegada. El ' + reserve.docName + ' está reservado por: ' + reserve.owner.alias);
                return;
            }

            const resIndex = docReservesStack.length;

            user.reserveIndex = resIndex;

            docReservesStack.push({ docName: _docName, owner: user });
 

            comment.user = user.alias;
            comment.msg = 'Reserva apectada: ' + _docName;   

            socket.emit('docReserveRes', {
                succes: true,
                message: comment.msg
            });
             
            io.emit('comment', comment);  

            console.log(comment);
        });



        socket.on('releaseDocReq', (_docName) => {
            console.log('releaseDocReq');

            if (user.reserveIndex === -1) { return; }

            const reserve = docReservesStack[user.reserveIndex];

            if (reserve.docName === _docName && reserve.owner === user) {

                comment.user = reserve.owner.alias;
                comment.msg = 'Reserva liberada: ' + _docName; 
                io.emit('comment', comment);
                console.log(comment);

                docReservesStack.splice(user.reserveIndex, 1);
                user.reserveIndex = -1;

                socket.emit('releaseDocRes', {
                    succes: true,
                    message: ''
                });

            }
            else {
                socket.emit('releaseDocRes', {
                    message: 'algo no salió bien'
                });
            }

        });



        socket.on("disconnect", () => { 

            const index = usersOn.findIndex(u => u.userIP === user.IP);  
            const userRes = user.reserveIndex;  

            if (userRes !== -1) {
                const reserve = docReservesStack[userRes]; 

                if (reserve.owner !== user) {
                    comment.user = user.alias;
                    comment.msg = 'FATAL ERROR!';
                    io.emit('comment', comment);
                    console.log('FATAL ERROR!');
                    return;
                } 
                comment.user = reserve.owner.alias;
                comment.msg = 'Reserva liberada por desconexión ' + reserve.docName;
                docReservesStack.splice(userRes, 1);
                io.emit('comment', comment);
                console.log(comment);
            }
            

            if (index !== -1) { 
                usersOn.splice(index, 1);
                comment.user = user.alias;
                comment.msg = 'Desconectado';
                io.emit("comment", comment);
                io.emit('usersOn', usersOn);
                console.log(comment);
                console.log('usuarios conectados', usersOn.length);
            }


        });







    });

}
