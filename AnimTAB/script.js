// elements for obtaining vals
const animationText = document.getElementById('animationText');
const coloredNick = document.getElementById('coloredNick');
const speed = document.getElementById('animation-speed')
const savedColors = ['00FFE0', 'EB00FF', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF'];
const formats = {
  0: {
    outputPrefix: '',
    color: '&#$1$2$3$4$5$6',
    char: '&'
  }
};
let updatespeed;
let inputDelay;

/* Copies contents to clipboard */
function copyTextToClipboard(text) {
  let textArea = document.createElement('textarea');
  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  document.execCommand('copy');
  alert('Copied output!');
  document.body.removeChild(textArea);
}

function showError() {
  if (speed.value % 50 != 0) {
    document.getElementById('error').style.display = 'block';
  } else {
    document.getElementById('error').style.display = 'none';
  }
}

function hex(c) {
  let s = '0123456789abcdef';
  let i = parseInt(c);
  if (i == 0 || isNaN(c))
    return '00';
  i = Math.round(Math.min(Math.max(0, i), 255));
  return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
}

/* Convert an RGB triplet to a hex string */
function convertToHex(rgb) {
  return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
}

/* Remove '#' in color hex string */
function trim(s) {
  return (s.charAt(0) == '#') ? s.substring(1, 7) : s
}

/* Convert a hex string to an RGB triplet */
function convertToRGB(hex) {
  let color = [];
  color[0] = parseInt((trim(hex)).substring(0, 2), 16);
  color[1] = parseInt((trim(hex)).substring(2, 4), 16);
  color[2] = parseInt((trim(hex)).substring(4, 6), 16);
  return color;
}

/**
 * JavaScript implementation of HexUtils Gradients from RoseGarden.
 * https://github.com/Rosewood-Development/RoseGarden/blob/master/src/main/java/dev/rosewood/rosegarden/utils/HexUtils.java#L358
 */
class Gradient {
  constructor(colors, numSteps) {
    this.colors = colors;
    this.gradients = [];
    this.steps = numSteps - 1;
    this.step = 0;

    const increment = this.steps / (colors.length - 1);
    for (let i = 0; i < colors.length - 1; i++)
      this.gradients.push(new TwoStopGradient(colors[i], colors[i + 1], increment * i, increment * (i + 1)));
  }

  /* Gets the next color in the gradient sequence as an array of 3 numbers: [r, g, b] */
  next() {
    if (this.steps <= 1)
      return this.colors[0];

    const adjustedStep = Math.round(Math.abs(((2 * Math.asin(Math.sin(this.step * (Math.PI / (2 * this.steps))))) / Math.PI) * this.steps));
    let color;
    if (this.gradients.length < 2) {
      color = this.gradients[0].colorAt(adjustedStep);
    } else {
      const segment = this.steps / this.gradients.length;
      const index = Math.min(Math.floor(adjustedStep / segment), this.gradients.length - 1);
      color = this.gradients[index].colorAt(adjustedStep);
    }

    this.step++;
    return color;
  }
}

class AnimatedGradient extends Gradient {
  constructor(colors, numSteps, offset) {
    super(colors, numSteps);
    this.step = offset;
  }
}

class TwoStopGradient {
  constructor(startColor, endColor, lowerRange, upperRange) {
    this.startColor = startColor;
    this.endColor = endColor;
    this.lowerRange = lowerRange;
    this.upperRange = upperRange;
  }

  colorAt(step) {
    return [
      this.calculateHexPiece(step, this.startColor[0], this.endColor[0]),
      this.calculateHexPiece(step, this.startColor[1], this.endColor[1]),
      this.calculateHexPiece(step, this.startColor[2], this.endColor[2])
    ];
  }

  calculateHexPiece(step, channelStart, channelEnd) {
    const range = this.upperRange - this.lowerRange;
    const interval = (channelEnd - channelStart) / range;
    return Math.round(interval * (step - this.lowerRange) + channelStart);
  }
}

/* Toggles the number of gradient colors between 2 and 10 based on user input */
function toggleColors(colors) {
  let clamped = Math.min(10, Math.max(2, colors));
  if (colors == 1 || colors == '') {
    colors = getColors().length;
  } else if (colors != clamped) {
    $('#numOfColors').val(clamped);
    colors = clamped;
  }
  const container = $('#hexColors');
  const hexColors = container.find('.hexColor');
  const number = hexColors.size();
  if (number > colors) {
    // Need to remove some colors
    hexColors.each((index, element) => {
      if (index + 1 > colors) {
        savedColors[index] = $(element).val();
        $(element).parent().remove();
      }
    });
  } else if (number < colors) {
    // Need to add some colors
    let template = $('#hexColorTemplate').html();
    for (let i = number + 1; i <= colors; i++) {
      let html = template.replace(/\$NUM/g, i).replace(/\$VAL/g, savedColors[i - 1]);
      container.append(html);
    }
    jscolor.install(); // Refresh all jscolor elements
  }
}

/* Gets all colored entered by the user */
function getColors() {
  const hexColors = $('#hexColors').find('.hexColor');
  const colors = [];
  hexColors.each((index, element) => {
    const value = $(element).val();
    savedColors[index] = value;
    colors[index] = convertToRGB(value);
  });
  return colors;
}

function onUserInput() {
  clearTimeout(inputDelay);
  inputDelay = setTimeout(updateOutputText, 300);
}

function updateOutputText() {
  let format = formats[0];

  let newNick = animationText.value
  if (!newNick) {
    newNick = 'Type something!'
  }

  const bold = document.getElementById('bold').checked;
  const italic = document.getElementById('italics').checked;
  const underline = document.getElementById('underline').checked;
  const strike = document.getElementById('strike').checked;

  const outputText = document.getElementById('outputText');
  const clampedSpeed = Math.ceil(speed.value / 50) * 50;
  outputText.innerText = '';

  // Generate the output text
  const charColors = []; // array of arrays
  for (let n = 0; n < newNick.length * 2; n++) {
    const colors = [];
    const gradient = new AnimatedGradient(getColors(), newNick.length, n);
    let output = format.outputPrefix;
    for (let i = 0; i < newNick.length; i++) {
      let char = newNick.charAt(i);
      if (char == ' ') {
        output += char;
        colors.push(null);
        continue;
      }

      let hex = convertToHex(gradient.next());
      colors.push(hex);
      let hexOutput = format.color;
      for (let n = 1; n <= 6; n++)
        hexOutput = hexOutput.replace(`$${n}`, hex.charAt(n - 1));
      output += hexOutput;
      if (bold) output += format.char + 'l';
      if (italic) output += format.char + 'o';
      if (underline) output += format.char + 'n';
      if (strike) output += format.char + 'm';
      output += char;
    }

    outputText.innerText = `  - "${output}"\n${outputText.innerText}`;
  }

  outputText.innerText = `logo:\n  change-interval: ${clampedSpeed}\n  texts:\n${outputText.innerText}`

  // Generate the actual text animation
  let step = 0;
  clearInterval(updatespeed)
  updatespeed = setInterval(() => {
    const gradient = new AnimatedGradient(getColors(), newNick.length * 2, step++);
    const colors = [];
    for (let i = 0; i < newNick.length; i++)
      if (newNick.charAt(i) != ' ')
        colors.push(convertToHex(gradient.next()));
    displayColoredName(newNick, colors.reverse());
  }, clampedSpeed);
  showError();
}

function displayColoredName(nickName, colors) {
  coloredNick.classList.remove('minecraftbold', 'minecraftibold', 'minecraftitalic');
  if (document.getElementById('bold').checked) {
    if (document.getElementById('italics').checked) {
      coloredNick.classList.add('minecraftibold');
    } else {
      coloredNick.classList.add('minecraftbold');
    }
  } else if (document.getElementById('italics').checked) {
    coloredNick.classList.add('minecraftitalic');
  }
  coloredNick.innerHTML = '';
  let colorIndex = 0;
  for (let i = 0; i < nickName.length; i++) {
    const coloredNickSpan = document.createElement('span');
    if (document.getElementById('underline').checked) {
      if (document.getElementById('strike').checked) {
        coloredNickSpan.classList.add('minecraftustrike');
      } else coloredNickSpan.classList.add('minecraftunderline');
    } else if (document.getElementById('strike').checked) {
      coloredNickSpan.classList.add('minecraftstrike');
    }

    const char = nickName[i];
    if (char == ' ') {
      coloredNickSpan.style.color = colors[colorIndex];
      coloredNickSpan.textContent = char;
    } else {
      coloredNickSpan.style.color = colors[colorIndex];
      coloredNickSpan.textContent = char;
      colorIndex++;
    }
    coloredNick.append(coloredNickSpan);
  }
}

toggleColors(2);
updateOutputText();
