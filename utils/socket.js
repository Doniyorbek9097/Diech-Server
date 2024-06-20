exports.socketHandler = (io, socket) => {
    
    socket.on('disconnect', () => {
      console.log('Ulanuvchi tark etild');
    });
  };
  