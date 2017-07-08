/*
todo:
settings for: filetypes, background colors
allow rename?
load scripts from local rather than cdn
settings
theme?
icon
down for maybe?
'reset' button that moves all images from good and bad back to the root?
*/

var fs = require('fs');
var path = require('path');
const { dialog } = require('electron').remote;
var imageFiles = [];
var keysEnabled = true;
var basePath = "";
var currentImg = "";
var fileExtensions = [".jpg", ".jpeg", ".png"];
var goodDirName = 'good'
var badDirName = 'bad'
var goodCounter = 0;
var badCounter = 0;

$(document).ready(function () {
    function readFiles(callback) {
        imageFiles = [];

        fs.readdir(basePath, (err, files) => {
            files.forEach(file => {
                //if file extension in list
                if ($.inArray(path.extname(file), fileExtensions) > -1) {
                    imageFiles.push(file);
                }
            }
            );
            updateTotalCount();

            goodCounter = 0;
            //read good and bad dirs if they exist
            if (fs.existsSync(basePath + goodDirName)) {
                fs.readdir(basePath + goodDirName, (err, files) => {

                    files.forEach(file => {
                        //if file extension in list
                        if ($.inArray(path.extname(file), fileExtensions) > -1) {
                            goodCounter++;
                        }
                    });
                    $('#goodCount').text(goodCounter);
                    updateTotalCount();

                });
            }
            badCounter = 0;

            if (fs.existsSync(basePath + badDirName)) {
                fs.readdir(basePath + badDirName, (err, files) => {
                    files.forEach(file => {
                        //if file extension in list
                        if ($.inArray(path.extname(file), fileExtensions) > -1) {
                            badCounter++;
                        }
                    });
                    $('#badCount').text(badCounter);
                    updateTotalCount();

                });
            }

            if (callback) {
                callback(imageFiles);
            }
        });
    }

    document.addEventListener("keydown", function keyDownTextField(e) {
        var keyCode = e.keyCode;
        if (keysEnabled) {
            if (keyCode == 37) {//keyCode == 74 || 
                bad();
            }
            if (keyCode == 39) { //keyCode == 75 || 
                good()
            }
        }
    }, false);

    $('#photoName').focusin(() => {
        keysEnabled = false;
    })

    $('#photoName').focusout(() => {
        keysEnabled = true;
    })

    $('#photoName').keypress(function (e) {
        if (e.which == 13) {
            $(this).blur();
        }
    });

    function rename(oldPath, newPath, callback) {
        if (oldPath != newPath) {
            fs.rename(oldPath, newPath, function (err) {
                if (err) console.log('ERROR: ' + err);
                currentImg = $('#photoName').val();
                callback();
                return;
            });
        }
        else {
            callback()

        }

    }

    function bad() {
        keysEnabled = false;
        moveImageLeft();
        rename((basePath + currentImg), (basePath + $('#photoName').val()), () => {


            invokeMoveToFolder('bad/');
        });

    }

    function good() {
        keysEnabled = false;
        moveImageRight();

        rename((basePath + currentImg), (basePath + $('#photoName').val()), () => {

            invokeMoveToFolder('good/');
        });

    }

    function updateTotalCount() {
        var totalCount = imageFiles.length + goodCounter + badCounter;
        $('#itemCount').text(totalCount);
        $('#itemsRemaining').text(imageFiles.length);
    }

    function invokeMoveToFolder(directory) {
        moveToFolder(currentImg, directory, () => {
            setTimeout(() => {
                loadInImage();
                resetImgPositions()
                setTimeout(() => {
                    resetImgPositions()
                    keysEnabled = true;
                }, 500)
            }, 500);
        });
    }

    function moveImageRight() {
        setLoadInToAnimatable()
        $("#animate").addClass("right");
    }

    function moveImageLeft() {
        setLoadInToAnimatable()
        $("#animate").addClass("left");
    }

    function setLoadInToAnimatable() {
        $(".loadInImage").attr('src', "");
        setAnimatableImage(currentImg)
    }

    function resetImgPositions() {
        $("#animatedImage").attr('src', "");
        $("#animate").removeClass("right left");
    }

    function setAnimatableImage(image) {
        if (!image) {
            image = getRandomImage();
        }
        $("#animatedImage").attr('src', basePath + image);
        $('#animatedImage').removeClass('noBorder');
    }

    function loadInImage(image) {
        $('#photoName').val("");

        if (imageFiles.length < 1) {
            $(".loadInImage").attr('src', "").fadeTo(300, 1);
            alert('End of pics!');
            return;
        }
        if (!image) {
            image = getRandomImage();
        }
        currentImg = image;
        $(".loadInImage").fadeTo(1, 0)
        $(".loadInImage").attr('src', basePath + image).fadeTo(300, 1)
        $("#photoName").val(currentImg);
    }

    function getRandomImage() {
        return imageFiles[Math.floor(Math.random() * imageFiles.length)];
    }

    function moveToFolder(image, directory, callback) {
        var oldPath = basePath + image
        var newPath = basePath + directory + image

        fs.rename(oldPath, newPath, function (err) {
            if (err) throw err
            readFiles(callback)
        })
    }

    function setupNewDirectories() {
        if (!fs.existsSync(basePath + "good")) {
            fs.mkdirSync(basePath + "good");
        }

        if (!fs.existsSync(basePath + "bad")) {
            fs.mkdirSync(basePath + "bad");
        }
    }

    function fixImageBorder() {
        if ($('#animatedImage').attr('src') == null) {
            $('#animatedImage').addClass('noBorder');
        }
    }

    function init() {
        var initialPath = "C:\\Users\\anton\\OneDrive\\Documents\\Electron\\photoSorter\\images\\";
        loadDirectory(initialPath);

        $('#dirName').click(function () {
            //require('child_process').exec('start "" ' + basePath);
            selectDirectory();
        });

        setupDragAndDrop();
    }

    function loadDirectory(directory) {
        basePath = directory;
        setupNewDirectories();
        readFiles((imageFiles) => {
            loadInImage();
            $('#itemCount').text(imageFiles.length);
            fixImageBorder();
        });
        updateBaseDir();
    }

    function updateBaseDir(path) {
        if (path) {
            basePath = path;
        }
        $('#dirName').text(basePath);
    }

    function setupDragAndDrop() {
        var holder = document;

        holder.ondragover = () => {
            $('#drag-file').css('opacity', '0.5');

            return false;
        };

        holder.ondragleave = () => {
            $('#drag-file').css('opacity', '0');


            return false;
        };

        holder.ondragend = () => {

            $('#drag-file').css('opacity', '0');


            return false;
        };

        holder.ondrop = (e) => {
            e.preventDefault();
            $('#drag-file').css('opacity', '0');

            for (let f of e.dataTransfer.files) {
                if (!f.type && f.size % 4096 == 0) {
                    // Only way to check that the file is a folder
                    loadDirectory(f.path + "\\");
                } else {
                    alert('Please select a folder!')
                }

                break;
            }

            return false;
        };
    }

    function selectDirectory() {
        var dialogResponse = dialog.showOpenDialog({ defaultPath: basePath, properties: ['openFile', 'openDirectory', 'multiSelections'] });
        if (dialogResponse) {
            console.log(dialogResponse)
            loadDirectory(dialogResponse[0] + "\\")
        }
    }



    init();
});