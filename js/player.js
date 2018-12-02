/*
 * Meow meow player v0.3.0 - a music player built with HTML5 audio API =>_<=
 * Author:Wayou
 * lisenced under the MIT license
 * for more information you can
 * visit the project page on github :https://github.com/Wayou/MeowmeowPlayer/
 * see the live demo :http://wayou.github.io/MeowmeowPlayer/
 * or contact me: liuwayong@gmail.com
 */
'use strict'
window.onload = function () {
    var player = new MmPlayer();
    player.ini();
}
var MmPlayer = function () {
    this.VERSION = '0.1.0';
    this.APP_NAME = 'Gplayer : import & play  ';
    this.title = this.APP_NAME, //the app title on the top of the page, will upgrade when songs playing
        this.audioContext = null;
    this.source = null;
    this.playlist = [];
    this.currentOrderNum = 0; //orderNum starts from 0
    this.currentFileName = null;
    this.timeContainer = document.getElementById('time');
    this.currentBuffer = null;
    this.listContainer = document.getElementById('playlist');
    this.status = 0; 
    this.canvas = document.getElementById('canvas');
    this.mirror = document.getElementById('mirror');
    this.animationId = null;
    this.titleUpdateId = null;
    this.forceStop = false;
    this.processing = false;
}
MmPlayer.prototype = {
    ini: function () {
        this._prepareAPI();
        this._startApp();
    },
    _prepareAPI: function () {
        //fix browser vender for AudioContext and requestAnimationFrame
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
        try {
            this.audioContext = new AudioContext();
        } catch (e) {
            this._updateTitle('!Your browser does not support AudioContext', false);
            console.log(e);
        }
    },
    _startApp: function () {
        var that = this,
            audioInput = document.getElementById('addFiles'),
            listContainer = document.getElementById('playlist'),
            playBtn = document.getElementById('playBtn'),
            emptyBtn = document.getElementById('emptyBtn'),
            shuffleBtn = document.getElementById('shuffleBtn'),
            preBtn = document.getElementById('preBtn'),
            nextBtn = document.getElementById('nextBtn'),
            pauseBtn = document.getElementById('pauseBtn'),
            muteBtn = document.getElementById('muteBtn'),
            upBtn = document.getElementById('upBtn'),
            downBtn = document.getElementById('downBtn');

        //listen the file upload
        audioInput.onchange = function () {
            if (that.audioContext === null || that.processing) {
                return;
            };
            //the if statement fixes the file selction cancle, because the onchange will trigger even the file selection been canceled
            if (audioInput.files.length !== 0) {
                document.getElementById('badge').innerHTML = audioInput.files.length;
                if (that.status === 1) {
                    //if a song is playing, jsut add the new files to the list,else add files and start to play
                    that.addToList(audioInput.files);
                    audioInput.value = '';
                } else {
                    that._updateTitle('Uploading', true);
                    that.addToList(audioInput.files);
                    audioInput.value = '';
                    that._getFilesAndRun();
                }
            };
        };

        pauseBtn.addEventListener('click', function (e) {
            if (that.status === 1) {
                //currently the song is playing, then sotre the progress time and pause it
                that.forceStop = true;
                that.source.stop(0);
                that.source = null;
                that.status = 0;
                that.currentFileName = null;

            } else {
                that.play(that.currentOrderNum);
            };
        })

        playBtn.addEventListener('click', function (e) {
            if (that.status === 0) {
                that.play(that.currentOrderNum);
            } else {

            };
        })



                //next  button
                nextBtn.addEventListener('click', function (e) {
                    if (that.processing) {
                        return;
                    };
                    if (that.currentOrderNum === that.playlist.length - 1) {
                        that.currentOrderNum = 0;
                    } else {
                        ++that.currentOrderNum;
                    };
                    that.play(that.currentOrderNum);
                })

                
        //pre  button
        preBtn.addEventListener('click', function (e) {
            if (that.processing) {
                return;
            };
            if (that.currentOrderNum === 0) {
                that.currentOrderNum = that.playlist.length - 1;
            } else {
                --that.currentOrderNum;
            };
            that.play(that.currentOrderNum);
        })






        //empty button
        emptyBtn.addEventListener('click', function (e) {
           
            document.getElementById('badge').innerHTML = 0;
            that.emptyList();
        })
        //shuffle button
        shuffleBtn.addEventListener('click', function (e) {
            that.shuffleList();
        })


        muteBtn.addEventListener('click', function(e){
            that.audioContext
        })




        listContainer.addEventListener('click', function (e) {
            if (that.processing) {
                return;
            };
            var target = e.target;
            if (e.target.className === 'title col-6') {
                //play selected item
                var selectedIndex = that._getSlectedIndex(e.target);
                if (selectedIndex === that.currentOrderNum) {
                    that.play(selectedIndex, 0); //if the current playing song is selected, then skip decode and play from 0 
                } else {
                    that.play(selectedIndex);
                };
            } else {
                if (e.target.className === 'remove col-4 btn-lg btn-circle rounded btn-danger') {
                    //remove selected item from list
                    var selectedIndex = that._getSlectedIndex(e.target);
                    that.removeFromList(selectedIndex, e.target.parentNode);
                };
            };
        });



        









    },
    _convertFileListToArray: function (files) {
        var result = [];
        for (var i = files.length - 1; i >= 0; i--) {
            result.push(files[i]);
        };
        return result;
    },
    _getFilesAndRun: function () {
        if (this.playlist.length === 0) {
            this._updateTitle(this.APP_NAME, false);
            return
        };
        this.play(0); //first run, play the first song
    },

    play: function (orderNum, time) {
        playBtn = document.getElementById('playBtn');
        this.processing = true;
        if (time !== undefined && this.source !== null) {
            this._drawSpectrum(this.audioContext, this.currentBuffer);
        } else {
            if (this.playlist.length === 0) {
                this.processing = false;
                return;
            };
            this.currentOrderNum = orderNum;
            this.currentFileName = this.playlist[orderNum].name.slice(0, -4);
            var lis = this.listContainer.getElementsByTagName('li');
            for (var i = lis.length - 1; i >= 0; i--) {
                if (i === orderNum) {
                    this.addClass(lis[i], 'current');
                } else {
                    this.removeClass(lis[i], 'current');
                }
            };
            this._readFile(orderNum);
        };
    },




    _readFile: function (orderNum) { //read file as arraybuffer
        var that = this,
            playlist = this.playlist,
            file = playlist[orderNum],
            reader = new FileReader();
        reader.onload = function (e) {
            var arraybuffer = e.target.result;
            that._decodeFile(arraybuffer);
        };
        reader.onerror = function (e) {
            that._updateTitle('!Fail to read the file', false);
            this.processing = false;
            console.log(e);
        };
        reader.readAsArrayBuffer(file);
    },



    _decodeFile: function (arraybuffer) {
        var that = this,
            audioContext = this.audioContext;
        if (audioContext === null) {
            return;
        };
        this._updateTitle('DECODED :: ' + this.currentFileName, true);
        //disable the control to avoid errors
        this._disableControl();
        audioContext.decodeAudioData(arraybuffer, function (buffer) {
            that._enableControl();
            that.currentBuffer = buffer;
            that._updateTitle('DECODED successfully,start the visualizer', true);
            that._drawSpectrum(audioContext, buffer);
        }, function (e) {
            that._enableControl();
            that._updateTitle('!Fail to decode the file', false);
            this.processing = false;
            console.log(e);
            //play the next song
            var lis = that.listContainer.getElementsByTagName('li');
            for (var i = lis.length - 1; i >= 0; i--) {
                if (i === that.currentOrderNum) {
                    if (!(lis[i].className.indexOf('fail') > 0)) {
                        that.addClass(lis[i], 'fail'); //mark the file as failed one
                    }
                    break;
                }
            };
            if (that.currentOrderNum === that.playlist.length - 1) {
                // that.currentOrderNum = 0;
                return;
            } else {
                ++that.currentOrderNum;
                that.play(that.currentOrderNum);
            };
        });
    },
    _drawSpectrum: function (audioCtx, buffer) {
        var that = this,
            source = audioCtx.createBufferSource(),
            analyser = audioCtx.createAnalyser(),
            canvas = this.canvas,
            mirror = this.mirror,
            canvasCtx = canvas.getContext('2d'),
            mirrorCtx = mirror.getContext('2d'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = [], ////store the vertical position of hte caps for the preivous frame
            gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(1, '#0f0');
        gradient.addColorStop(0.5, '#ff0');
        gradient.addColorStop(0, '#f00');
        //setup the audio
        source.buffer = buffer;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        if (this.source !== null) {
            this.forceStop = true;
            this.source.stop(0);
            this.status = 0;
        };
        cancelAnimationFrame(this.animationId); //stop the previous animation
        source.onended = function () {
            that._audioEnd();
        };
        source.start(0);
        this.processing = false;
        this._updateTitle('PLAYING  ::  ' + this.playlist[this.currentOrderNum].name.slice(0, -4), false);
        this.source = source;
        this.status = 1;
        var drawFrame = function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            //draw the visualizer stuff on the canvas
            var step = Math.round(array.length / meterNum); //sample limited data from the total array
            canvasCtx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i < meterNum; i++) {
                var value = array[i * step];
                if (capYPositionArray.length < Math.round(meterNum)) {
                    capYPositionArray.push(value);
                };
                canvasCtx.fillStyle = capStyle;
                //draw the cap, with transition effect
                if (value < capYPositionArray[i]) {
                    canvasCtx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                } else {
                    canvasCtx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                };
                canvasCtx.fillStyle = gradient; //set the filllStyle to gradient for a better look
                canvasCtx.fillRect(i * 12 /*meterWidth+gap*/, cheight - value + capHeight, meterWidth, cheight); //the meter
            }
            //draw the mirror
            mirrorCtx.clearRect(0, 0, cwidth, cheight);
            mirrorCtx.drawImage(canvas, 0, -100, cwidth, cheight);
            //display time
            // if (that.source !== null&&that.status===1) {
            //     that.timeContainer.textContent = that._timeFormat(that.audioContext.currentTime);
            // } else {
            //     that.timeContainer.textContent = '&nbsp;';
            // };
            that.animationId = requestAnimationFrame(drawFrame);
        };
        that.animationId = requestAnimationFrame(drawFrame);
    },
    _timeFormat: function (seconds) {
        var result = '00:' + Math.round(seconds);
        if (seconds > 59) {
            var min = Math.floor(seconds / 60),
                sec = Math.floor(seconds % 60);
            result = (min > 9 ? min : ('0' + min)) + ':' + (sec > 9 ? sec : ('0' + sec));
        };
        return result;
    },
    _disableControl: function () {
        var overlay = document.createElement('div'),
            loader = document.createElement('div'),
            controlPanel = document.getElementsByClassName('control')[0],
            i = 0;
        overlay.className = 'overlay';
        loader.className = 'loader';
        while (i < 5) {
            var circle = document.createElement('div');
            circle.className = 'circle';
            loader.appendChild(circle);
            i++;
        }
        overlay.appendChild(loader);
        controlPanel.appendChild(overlay);
    },

    
    _enableControl: function () {
        var overlay = document.getElementsByClassName('overlay')[0],
            controlPanel = document.getElementsByClassName('control')[0];
        controlPanel.removeChild(overlay);
    },


    stop: function () {
        this.forceStop = true;
        this.source.stop(0);
        this.status = 0;
    },
    addToList: function (files) {
        var that = this,
            li,
            container = this.listContainer,
            docFragment = document.createDocumentFragment(); //use docfragment to improve the performance
        for (var i = files.length - 1; i >= 0; i--) {
            if (files[i].size > 31457280) {
                alert("Refuse adding " + files[i].name + " to library");
                console.log(files[i].name + 'skiped for file size larger than 30Mb');
                continue;
            };
            li = document.createElement("li");
            li.innerHTML = '<span class="remove col-4 btn-lg btn-circle rounded btn-danger" title="remove from list">  X  </span>' + '<span class="title col-6" >' + files[i].name.slice(0, -4) + '</span>';
            docFragment.appendChild(li);
            this.playlist.push(files[i]);
        };
        container.appendChild(docFragment); //add entries to the playlist
    },
    removeFromList: function (orderNum, targetEle) {
        this.playlist.splice(orderNum, 1); //remove the specified item from the list
        this.listContainer.removeChild(targetEle);
        if (orderNum < this.currentOrderNum) {
            this.currentOrderNum -= 1;
            return;
        };
        if (this.playlist.length === 0) {
            //list is empty, reset all variables
            this.forceStop = true;
            this.source.stop(0);
            this.source = null;
            this.status = 0;
            this.currentFileName = null;
            this.currentOrderNum = 0;
            return;
        };
        if (orderNum === this.currentOrderNum) {
            if (this.currentOrderNum === this.playlist.length) {
                this.play(0);
            } else {
                this.play(this.currentOrderNum);
            };
        }
    },
    emptyList: function () {
        this.playlist = [];
        this.forceStop = true;
        this.currentFileName = null;
        if (this.status === 1) {
            this.source.stop(0);
            cancelAnimationFrame(this.animationId); //stop the previous animation
        }
        this.source = null;
        this.status = 0;
        while (this.listContainer.firstChild) {
            this.listContainer.removeChild(this.listContainer.firstChild);
        };
        this._updateTitle(this.APP_NAME, false);
        this.mirror.getContext('2d').clearRect(0, 0, this.mirror.width, this.mirror.height);
        this.drawMarkCat();
    },
    shuffleList: function () {
        var container = this.listContainer,
            l = this.playlist.length,
            docFragment = document.createDocumentFragment();

        this._shuffleArray(this.playlist);
        for (var i = 0; i < l; i++) {
            if (this.currentFileName === this.playlist[i].name.slice(0, -4)) {
                this.currentOrderNum = i;
                break;
            };
        };
        //empty the playlist on the page
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        };
        //re-fill the playlist on the page with new order
        for (var i = 0; i < l; i++) {
            var li = document.createElement("li");
            li.innerHTML = '<span class="remove" title="remove from list">X</span>' + '<span class="title" >' + this.playlist[i].name.slice(0, -4) + '</span>';
            if (i === this.currentOrderNum) {
                li.className = 'current ';
            };
            docFragment.appendChild(li);

        };
        container.appendChild(docFragment);
    },
    _shuffleArray: function (array) {
        //http://bost.ocks.org/mike/shuffle/
        var m = array.length,
            t, i;
        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);
            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        // return array;
    },
    _audioEnd: function () {
        // this.timeContainer.textContent ='&nbsp;';
        // this.audioContext.currentTime=0;
        if (this.forceStop) {
            this.forceStop = false;
            return;
        };
        this.source = null;
        this._updateTitle(this.APP_NAME, false);
        if (this.currentOrderNum === this.playlist.length - 1) {
            this.currentOrderNum = 0;
        } else {
            this.currentOrderNum += 1;
        };
        this.play(this.currentOrderNum);
    },
    _getSlectedIndex: function (target) {
        var li = target.parentNode,
            index = 0;
        // this.addClass(li, 'currentItem');
        while (li.previousElementSibling) {
            li = li.previousElementSibling;
            index += 1;
        }
        return index;
    },
    _updateTitle: function (text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if (this.titleUpdateId !== null) {
            clearTimeout(this.titleUpdateId);
        };
        if (processing) {
            //animate dots at the end of the info text
            var animateDot = function () {
                if (i > 3) {
                    i = 0
                };
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.titleUpdateId = setTimeout(animateDot, 250);
            }
            this.titleUpdateId = setTimeout(animateDot, 250);
        };
    },
    addClass: function (el, cls) {
        //reference:http://stackoverflow.com/questions/6787383/what-is-the-solution-to-remove-add-a-class-in-pure-javascript
        el.className += ' ' + cls;
    },
    removeClass: function (el, cls) {
        var elClass = ' ' + el.className + ' ';
        while (elClass.indexOf(' ' + cls + ' ') != -1) elClass = elClass.replace(' ' + cls + ' ', '');
        el.className = elClass;
    }
}