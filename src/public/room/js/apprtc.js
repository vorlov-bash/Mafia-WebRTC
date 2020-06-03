const localVideoElement = $("#localVideo");
const webrtc = new SimpleWebRTC({
    localVideoElement: 'localVideo',
    autoRequestMedia: true,

});
webrtc.config({
    'configUrl': 'https://api.simplewebrtc.com/config/user/1eba2b8d7f6214af3a3750e2'
});
webrtc.on('localStream', () => {
    localVideoElement.show()
});
