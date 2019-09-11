// ==UserScript==
// @name         心动网络选餐脚本
// @namespace    https://github.com/xuanblue/XDMealOrderScript
// @version      1.2.1
// @description  便捷个性化辅助选餐；保存选餐结果。由https://greasyfork.org/zh-CN/scripts/372414-%E9%80%89%E9%A5%AD加工丰富而来。
// @author       xuanbang
// @contribution xiedi
// @match        https://wj.qq.com/*
// @license      MIT
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @grant        none
// ==/UserScript==

this.$ = window.$;

$('head').append('<style type="text/css">.btn-event {  display: inline-block;  width: 85px;  line-height: 34px;  padding: 0 10px;  margin: 0 10px;  text-align: center;  border-radius: 3px;  background-color: #018fff;  color: #fff;  cursor: pointer; }');
$('head').append('<style type="text/css">.btn-event:hover { background-color: #008FFF; }');
$('head').append('<style type="text/css">.btn-export { line-height: 40px; }');
$('head').append('<style type="text/css">.notSelected { font-size: 18px; color: rgba(255,0,0,1); }');

window.addEventListener('load', function () {
    if (!checkIsOrderingToInit()) {
        setTimeout(checkIsOrderingToInit, 2000);
    }
});

function checkIsOrderingToInit() {
    var title = $(".survey-header-title").text();
    if (title.includes("一周选饭")) {
        init();
        return true;
    }
    return false;
}

function init() {
    var question_list = $(".question-list");
    addFavors(question_list);
    addOneKeyBtns(question_list);
    selectUsername();
    setSelectedTag();
    addExportBtns();
}

function addFavors(position) {
    position.before('<div id="separateDiv">');
    var separateDiv = $("#separateDiv");
    separateDiv.append('<input id="separate" type="checkbox" style="font-size:18px; width:16px; height:16px;">&nbsp; <b>午晚餐分离</b></input>');
    $("#separate").click(function() {
        var separate = $("#separate").prop("checked");
        var hasFavorsDinner = $("#favorsDinner").length > 0;
        if (separate) {
            if (hasFavorsDinner) {
                $("#favorsDinner").show();
            } else {
                $("#favors").after('<input id="favorsDinner" type="text" class="inputs-input" placeholder="晚餐">');
                var favorsConent = localStorage.getItem("favorsDinner");
                if (favorsConent != null) {
                    $("#favorsDinner").val(favorsConent);
                }
            }
            $("#favors").prop("placeholder", "午餐");
        } else {
            if (hasFavorsDinner) {
                $("#favorsDinner").hide();
            }
            $("#favors").prop("placeholder", "午、晚餐");
        }
    });
    separateDiv.append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <input id="jumpToSubmit" type="checkbox" style="font-size:18px; width:16px; height:16px;">&nbsp; <b>选完跳转到提交按钮</b></input>');

    position.before('<div id="favorsDiv">');
    var favorsDiv = $("#favorsDiv");
    favorsDiv.append('<b><label for="favors" style="font-size:18px">喜好列表, 用"；"隔开：</label></b>');
    favorsDiv.append('&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ');
    favorsDiv.append('<input id="useRegex" type="checkbox" style="font-size:18px; width:16px; height:16px;">&nbsp; <b>使用正则</b></input>');
    favorsDiv.append('<a target="_blank" href="https://www.runoob.com/regexp/regexp-syntax.html">（语法帮助）</a>（例：小炒肉.*红采.*；自助餐）');
    favorsDiv.append('<input id="favors" type="text" class="inputs-input" placeholder="午、晚餐">');
    favorsDiv.append('<br/><br/>');

    var storageSeparate = localStorage.getItem("separate") == "true";
    if (storageSeparate) {
        $("#separate").click();
    }

    var useRegex = localStorage.getItem("useRegex") == "true";
    $("#useRegex").prop("checked", useRegex);
    var jumpToSubmit = localStorage.getItem("jumpToSubmit") == "true";
    $("#jumpToSubmit").prop("checked", jumpToSubmit);

    var favorsConent = localStorage.getItem("favors");
    if (favorsConent != null) {
        $("#favors").val(favorsConent);
    }

    var save_btn = createBtn("保存喜好", "btn btn-event", function() {
        saveFavors();
        alert("喜好列表保存成功");
    });
    var favors_btn = createBtn("一键喜好", "btn btn-event", function() {
        saveFavors();
        autoselectFavors();
        getSelectedResult();
    });
    position.before(save_btn);
    position.before(favors_btn);
}

function saveFavors() {
    localStorage.setItem("favors", $("#favors").val());
    if ($("#favorsDinner") != null) {
        localStorage.setItem("favorsDinner", $("#favorsDinner").val());
    } else {
        localStorage.removeItem("favorsDinner");
    }

    localStorage.setItem("separate", $("#separate").prop("checked"));
    localStorage.setItem("useRegex", $("#useRegex").prop("checked"));
    localStorage.setItem("jumpToSubmit", $("#jumpToSubmit").prop("checked"));
}

function autoselectFavors() {
    var favorsConent = localStorage.getItem("favors");
    if (favorsConent == null || favorsConent.length == 0) {
        alert("请填写午饭喜好列表");
        return;
    }

    var separate = $("#separate").prop("checked");
    var favors = favorsConent.split('；').reverse();
    for (const favor of favors) {
        if (separate) {
            oneKeySelect(favor, "午饭");
        } else {
            oneKeySelect(favor);
        }
    }

    if (!separate) {
        return;
    }

    var favorsDinnerConent = localStorage.getItem("favorsDinner");
    if (favorsDinnerConent == null || favorsDinnerConent.length == 0) {
        alert("请填写晚饭喜好列表");
        return;
    }
    var favorsDinner = favorsDinnerConent.split('；').reverse();
    for (const favor of favorsDinner) {
        oneKeySelect(favor, "晚饭");
    }
}

function addOneKeyBtns(position) {
    var buffet_btn = createBtn("一键自助", "btn btn-event", function() {
        oneKeySelect("自助餐");
        getSelectedResult();
    });
    position.before(buffet_btn);

    var noeat_btn = createBtn("一键修仙", "btn btn-event", function() {
        oneKeySelect("不吃");
        getSelectedResult();
    });
    position.before(noeat_btn);
}

function oneKeySelect(content, title) {
    var useRegex = $("#useRegex").prop("checked");
    var questions = $(".question-list section");
    for (const question of questions) {
        var option_items = question.querySelectorAll(".checkbox-option");
        if (title !== undefined) {
            var titleSpan = question.querySelector("strong>span");
            if (titleSpan == null || titleSpan.innerText.indexOf(title) < 0) {
                continue;
            }
        }
        for (const option_item of option_items) {
            if (useRegex) {
                if (content.trim().length > 0 && option_item.textContent.trim().search(content) >= 0) {
                    option_item.querySelector("label").click();
                    break;
                }
            } else if (option_item.textContent.trim().includes(content)) {
                option_item.querySelector("label").click();
                break;
            }
        }
    }
    var jumpToSubmit = $("#jumpToSubmit").prop("checked");
    if (jumpToSubmit) {
        window.scrollTo(0, document.querySelector(".survey-container").scrollHeight);
    }
}

function selectUsername() {
    var username = localStorage.getItem("username");
    var users = $(".select-list-li");
    for (const user of users) {
        var userText = user.textContent.trim();
        if (userText.startsWith("--")) {
            continue;
        }
        user.onclick = function(name) {
            return function() {
                localStorage.setItem("username", name);
            };
        }(userText);
        if (username == userText) {
            user.click();
        }
    }
}

function addExportBtns() {
    var title = $(".survey-header-title").text();
    var submit_btn = $(".btn-submit");

    var exportTxt_btn = createBtn("导出文本", "btn btn-event btn-export", function() {
        var result = getSelectedResult();
        downloadResult(title + ".txt", showTxtResult(result), "text/plain");
    });
    submit_btn.before(exportTxt_btn);

    var exportIcs_btn = createBtn("导出日历", "btn btn-event btn-export", function() {
        var result = getSelectedResult();
        downloadResult(title + ".ics", showIcsResult(result), "text/calendar");
    });
    submit_btn.before(exportIcs_btn);
}

function createBtn(title, className, clickFunc) {
    var button = document.createElement("button");
    button.className = className;
    button.textContent = title;
    button.onclick = clickFunc;
    return button;
}

function setSelectedTag() {
    var questions = $(".question-list section");
    for (const question of questions) {
        if (question.querySelector(".selectbox") != null) {
            continue;
        }
        if (question.querySelector(".checkbox-option") != null) {
            var questionBody = question.querySelector(".question-body");
            var option_items = questionBody.querySelectorAll(".checkbox-option");
            for (var i = 0; i < option_items.length; i++) {
                var label = option_items[i].querySelector("label");
                label.onclick = function(body, index) {
                    return function() {
                        body.setAttribute("selected-index", index);
                        var notSelected = question.querySelector(".notSelected");
                        if (notSelected != null) {
                            $(notSelected).remove();
                        }
                    };
                }(questionBody, i);
            }
        }
    }
}

function getSelectedResult() {
    var result = {
        username: "",
        foods: []
    };
    var questions = document.querySelector('.question-list').querySelectorAll("section");
    for (const question of questions) {
        if (question.querySelector(".selectbox") != null) {
            result.username = question.querySelector(".select-result").textContent.trim();
            continue;
        }

        if (question.querySelector(".checkbox-option") != null) {
            var title = question.querySelector(".question-head").querySelector(".question-title").textContent.trim();
            var foodInfo = getFoodInfoFromTitle(title);
            var questionBody = question.querySelector(".question-body");
            var index = parseInt(questionBody.getAttribute("selected-index"));
            if (isNaN(index)) {
                var notSelected = question.querySelector(".notSelected");
                if (notSelected == null) {
                    $(question).prepend('<a class="notSelected"><b>-----------尚 未 选 择-----------</b></a>');
                }
                continue;
            } else {
                var option_items = questionBody.querySelectorAll(".checkbox-option");
                var option_item = option_items[index];
                foodInfo.content = option_item.textContent.trim();
            }
            if (foodInfo.content.includes("不吃")) {
                foodInfo.not_eat = true;
            }
            result.foods.push(foodInfo);
        }
    }

    result.foods.sort(function(a, b) {
        if (a.year < b.year) {
            return -1;
        } else if (a.year > b.year) {
            return 1;
        }

        if (a.month < b.month) {
            return -1;
        } else if (a.month > b.month) {
            return 1;
        }

        if (a.day < b.day) {
            return -1;
        } else if (a.day > b.day) {
            return 1;
        }

        if (a.am < b.am) {
            return -1;
        } else if (a.am > b.am) {
            return 1;
        }

        return 0;
    });

    return result;
}

function getFoodInfoFromTitle(title) {
    var foodInfo = {
        year: 0,
        month: 0,
        day: 0,
        am: 0,
        not_eat: false,
        content: ""
    };
    var monthArray = title.split('月');
    foodInfo.month = getNumberByStr(monthArray[0]);
    foodInfo.day = getNumberByStr(monthArray[1].split('日')[0]);
    var now = new Date();
    foodInfo.year = now.getFullYear();
    if ((11 == now.getMonth()) && (1 == foodInfo.month)) {
        // 进入第二年
        foodInfo.year += 1;
    }
    if (title.includes("晚")) {
        foodInfo.am = 1;
    }
    return foodInfo;
}

function getNumberByStr(str) {
    str = str.trim();
    var num = 0;
    var char;
    if (str.length > 0) {
        num += charToNum(str[str.length - 1], 1);
    }
    if (str.length > 1) {
        num += charToNum(str[str.length - 2], 10);
    }
    return num;
}

function charToNum(x, scale) {
    var parsed = parseInt(x, 10);
    if (isNaN(parsed)) {
        return 0;
    }
    return parsed * scale;
}

function showTxtResult(result) {
    var showValue = "";
    var newline = "\n";
    if (navigator.platform.includes("Win")) {
        newline = "\r\n";
    }
    showValue += result.username + newline;

    var day = "";
    result.foods.forEach(function(food) {
        if (0 == food.am) {
            day = food.day;
            showValue += food.year + "年" + food.month + "月" + food.day + "日" + newline + "午餐：" + food.content + newline;
        } else {
            if (food.day != day) {
                showValue += food.year + "年" + food.month + "月" + food.day + "日" + newline;
            }
            showValue += "晚餐：" + food.content + newline;
        }
    });
    console.log(showValue);
    return showValue;
}

function showIcsResult(result) {
    var showValue = "BEGIN:VCALENDAR\n" +
        "PRODID:-//Web Environment//Tampermonkey//EN\n" +
        "VERSION:2.0\n";
    result.foods.forEach(function(food) {
        if (!food.not_eat) {
            showValue += createIcsEvent(food);
        }
    });
    showValue += "END:VCALENDAR";
    return showValue;
}

function createIcsEvent(food) {
    var ics_event = "BEGIN:VEVENT\n";
    var foodTime = new Date();
    var nowTZ = getTZDate(foodTime, true);
    ics_event += "DTSTAMP:" + nowTZ + "\n" +
        "CREATED:" + nowTZ + "\n" +
        "UID:" + guid() + "\n" +
        "SEQUENCE:1\n" +
        "LAST-MODIFIED:" + nowTZ + "\n";

    foodTime.setFullYear(food.year);
    foodTime.setMonth(food.month - 1);
    foodTime.setDate(food.day);
    //     var reg = /（([^）]+)）/;
    var reg = /（([^）]+)）([^（]+)(.*)/;
    var regResult = reg.exec(food.content);
    var short = "";
    if (regResult != null) {
        short = regResult[1];
        if (regResult.length > 2) {
            short += regResult[2];
        }
    }
    if (0 == food.am) {
        foodTime.setHours(12, 0, 0, 0);
        ics_event += "SUMMARY:午-" + short;
    } else {
        foodTime.setHours(18, 0, 0, 0);
        ics_event += "SUMMARY:晚-" + short;
    }

    ics_event += "\nDESCRIPTION:" + food.content + "\n";

    ics_event += "DTSTART;TZID=Asia/Shanghai:" + getTZDate(foodTime, false) + "\n";
    foodTime.setMinutes(30 + foodTime.getMinutes());
    ics_event += "DTEND;TZID=Asia/Shanghai:" + getTZDate(foodTime, false) + "\n";

    ics_event += "BEGIN:VALARM\n" +
        "DESCRIPTION:\n" +
        "ACTION:DISPLAY\n" +
        "TRIGGER;VALUE=DURATION:-PT5M\n" +
        "END:VALARM\n" +
        "END:VEVENT\n";
    return ics_event;
}

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

function getTZDate(date, withZ) {
    var tz = "" + date.getUTCFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) + "T" +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
    if (withZ) {
        tz += "Z";
    }
    return tz;
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function downloadResult(filename, text, suffix) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + suffix + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}



