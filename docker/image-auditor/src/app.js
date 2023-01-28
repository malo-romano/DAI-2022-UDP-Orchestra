import dgram from "node:dgram";
import net from "node:net";
import moment from "moment";

const udpSocket = dgram.createSocket("udp4");

const config = {
    "multicast-group": "239.42.13.37",
    "multicast-port": 1234,
    "tcp-port": 2205,
    "keep-active-timeout": 5000,
    "sounds": {
        "ti-ta-ti": "piano",
        "pouet": "trumpet",
        "trulu": "flute",
        "gzi-gzi": "violin",
        "boum-boum": "drum"
    }
}


udpSocket.bind(config['multicast-port'], () => {
    const currentDateTime = moment(Date.now()).format('DD.MM.YYYY HH:mm:ss');
    console.log(`[${currentDateTime}] Auditor : I'm listening on ${config['multicast-group']}:${config['multicast-port']}`);
    udpSocket.addMembership(config['multicast-group']);
});

const activeMusicians = new Map();

udpSocket.on("message", (message, source) => {
    const soundEmitted = JSON.parse(message);
    if (soundEmitted.hasOwnProperty("sound") && soundEmitted.hasOwnProperty("uuid")) {
        const currentDateTime = moment(Date.now()).format('DD.MM.YYYY HH:mm:ss');
        console.log(`[${currentDateTime}] Auditor : I just received sound ${message} from ${source.address}:${source.port}`);
        if (config.sounds.hasOwnProperty(soundEmitted.sound)) {
            activeMusicians.set(soundEmitted.uuid, {
                instrument: config.sounds[soundEmitted.sound],
                activeSince: dayjs().format()
            })
        }
    }
});


setInterval(() => {
    activeMusicians.forEach((uuid, musician) => {
        if (dayjs().diff(musician.activeSince) > config['keep-active-timeout']) {
            activeMusicians.delete(uuid);
        }
    });
}, config['keep-active-timeout'])

// TCP server

const tcpServer = net.createServer();

tcpServer.on("connection", socket => {
    const payload = Array.from(activeMusicians.entries())
        .filter(([uuid, musician])=> musician.activeSince > dayjs().subtract(config['keep-active-timeout'], 'ms').format())
        .map(([uuid, musician]) => ({uuid: uuid, ...musician}))
    socket.write(JSON.stringify(payload));
    socket.end();
});

tcpServer.listen(config['tcp-port'], () => {
    const currentDateTime = moment(Date.now()).format('DD.MM.YYYY HH:mm:ss');
    console.log(`[${currentDateTime}] Auditor : I'm now accepting TCP connections on port ${config['tcp-port']}`);
});