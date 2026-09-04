module.exports = {
	config: {
		name: "vut",
    aliases: ["vutfm","fm"],
		version: "1.0",
		author: "SK-SIDDIK-KHAN",
		countDown: 5,
		role: 0,
		category: "user",
	},
 
	 onStart: async function ({ api, event, message }) {
    const senderID = event.senderID;
 
    const loadingMessage = await message.reply({
      body: "Loading Vut Fm... Please Wait ⏰",
    });
     
	 var link = [
 
  "https://drive.google.com/uc?id=1DyhbJ-j-4N0dJBf7cqZ3HJlfVSqFPFNr",
   
   "https://drive.google.com/uc?id=1E6c3W9QcSUxxlfhPzMbM_8QAUwJGjJ20",
   
   "https://drive.google.com/uc?id=1E2BG1gb8T33SrFo5CkWHJACwHdv2iwdF",
   
   "https://drive.google.com/uc?id=1E9h0tfBCHyTZuDNZnPlifCKLxJDy9jBe",
   
   "https://drive.google.com/uc?id=1E2JuP8aIqW6bTqlB0yavXKxQPY1o6RPI",
   
   "https://drive.google.com/uc?id=1E9cK5e2vRvesVAsFeWvX7PtM-eE5I4H4",
   
   "https://drive.google.com/uc?id=1E103RtEOdMaVS30TXLreISz5Vg5bEkxl"
   
 ];
     let audio = link[Math.floor(Math.random()*link.length)]

   if (senderID !== null) {
      message.reply({
        body: '[ 🅥🅤🅣-🅕🅜 ]',
        attachment: await global.utils.getStreamFromURL(audio)
      });
 
      setTimeout(() => {
        api.unsendMessage(loadingMessage.messageID);
      }, 800);
    }
  },
};
