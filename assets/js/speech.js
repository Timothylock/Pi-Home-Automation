// Starts listening for command
function listen(){
  annyang.start({ autoRestart: false, continuous: false });
}

// Speech Synthesis
function speak(text){
	var msg = new SpeechSynthesisUtterance();
	var voices = window.speechSynthesis.getVoices();
	msg.voice = voices[10];
	msg.voiceURI = 'Google UK English Female';
	msg.volume = 1; // 0 to 1
	msg.rate = 0.9; // 0.1 to 10
	msg.pitch = 0; //0 to 2
	msg.text = text;
	msg.lang = 'en-GB';

	speechSynthesis.speak(msg);
}