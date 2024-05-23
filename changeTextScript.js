//click to change text 
//document.getElementById('changeableText').onclick = function() {
  //  this.textContent = 'You changed the text!';
//};

// toggl text back and forth 
document.getElementById('changeableText').onclick = function() {
    var paragraph = document.getElementById('changeableText');
    
    if (paragraph.textContent === 'Click me to change my text!') {
        paragraph.textContent = 'You changed the text! Click again to change back.';
    } else {
        paragraph.textContent = 'Click me to change my text!';
    }
}; 
