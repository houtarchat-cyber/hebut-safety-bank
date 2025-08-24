const questionData = new Map();

// Update questionData function
const updateQuestionData = (questionId, answer, questType) => {
  questionData.set(questionId, {
    answer,
    questType,
  });
};

// Get question data
const getQuestionData = (questionId) => {
  return questionData.get(questionId);
};

// Optimized function to handle setting of values
const setAllVle = ({ questionId, questType }) => {
  // 检查 questionId 是否已存在于 questionData 中
  const existingData = getQuestionData(questionId);
  if (existingData) {
    if (existingData.questType === "2") {
      existingData.answer.forEach((option) =>
        setVle(`${questionId}-${option}`),
      );
      return;
    }
    // 如果 questionData 中已存在此 questionId，直接填充答案
    setVle(`${questionId}-${existingData.answer}`);
    return; // 直接返回，不再执行后续操作
  }

  // 如果 questionData 中没有此 questionId，按现有的操作进行处理
  const options = {
    1: () => {
      setVle(`${questionId}-A`);
      updateQuestionData(questionId, "A", "1");
    },
    2: () => {
      const optionsAll = ["A", "B", "C", "D", "E", "F"];
      // Only update once, batch setting if possible
      optionsAll.forEach((option) => setVle(`${questionId}-${option}`));
      updateQuestionData(questionId, optionsAll, "2");
    },
    3: () => {
      setVle(`${questionId}-1`);
      updateQuestionData(questionId, "1", "3");
    },
  };

  // Execute the corresponding action for the question type
  const action = options[questType];
  if (action) {
    action();
  } else {
    console.warn(`Unknown question type for ${questionId}:`, questType);
    // Optionally handle default case, e.g. reset question data or trigger error handling
  }
};

// 从服务器获取数据并更新 questionData
const updateAnswersFromLog = async (logId) => {
  logId = logId ?? $("#logId").val();
  try {
    // 请求数据
    const response = await fetch(
      `http://wap.xiaoyuananquantong.com/guns-vip-main/wap/wrong/list?errorLogId=${logId}&page=1&limit=100`,
    );

    // 检查响应状态
    if (!response.ok) {
      throw new Error("网络请求失败");
    }

    // 解析 JSON 数据
    const data = await response.json();

    // 提取数据并更新 questionData
    data.data.data.forEach((item) => {
      const { questionId, question } = item;
      if (question && question.answer) {
        // 更新 questionData 中的答案
        if (question.quesType === "2") {
          updateQuestionData(
            questionId,
            question.answer.split(",").toSpliced(-1),
            question.quesType,
          );
        } else {
          updateQuestionData(questionId, question.answer, question.quesType);
        }
      }
    });
    console.log("答案更新成功");
    exportQuestionData();
  } catch (error) {
    console.error("更新答案失败:", error);
  }
};

// 导出 questionData 为 JSON 字符串
const exportQuestionData = () => {
  const exportData = {};

  // 将 Map 转换为普通对象
  questionData.forEach((value, key) => {
    exportData[key] = value;
  });

  // 转换为 JSON 字符串
  const jsonData = JSON.stringify(exportData);
  sessionStorage.setItem("questionData", jsonData);

  // 可以通过复制到剪贴板或者下载文件
  return jsonData;
};

// 导入 JSON 数据到 questionData
const importQuestionData = (jsonData) => {
  jsonData = jsonData ?? sessionStorage.getItem("questionData") ?? "{}";
  try {
    // 解析传入的 JSON 数据
    const parsedData = JSON.parse(jsonData);

    // 清空现有的 questionData
    questionData.clear();

    // 将解析后的数据填充到 questionData
    for (const [questionId, { answer, questType }] of Object.entries(
      parsedData,
    )) {
      questionData.set(questionId, {
        answer,
        questType,
      });
    }
    console.log("数据导入成功");
  } catch (error) {
    console.error("导入数据时出错:", error);
  }
};

importQuestionData();

const fetchDataAndProcess = async () => {
  try {
    // 获取参数值
    const logId = $("#logId").val();
    const currPage = parseInt($("#currPage").val());
    const ah = $("#ah").val();
    const userId = $("#userId").val();

    // 发起 fetch 请求
    const response = await fetch(
      `/guns-vip-main/wap/test/list?logId=${logId}&page=${currPage}&limit=200&ah=${ah}&userId=${userId}`,
    );

    // 检查响应是否成功
    if (!response.ok) {
      throw new Error("网络请求失败");
    }

    // 解析 JSON 数据
    const data = await response.json();

    // 检查数据是否存在
    if (data?.data?.data) {
      data.data.data.forEach(setAllVle);
      console.log("数据处理成功");
      $.ajax({
        //几个参数需要注意一下
        type: "post", //方法类型
        url: "/guns-vip-main/wap/imitateTest", //url
        data: $("#form").serialize(),
        dataType: "json",
        async: true,
        beforeSend: showLoading(),
        complete: setTimeout(function () {
          removeLoading();
        }, 1500),
        success: function (result) {
          if (result.code == "200") {
            var data = result.data;
            var sysSource = $("#sysSource").val();
            $("#score").html(data.count + "分");

            $("#error").html(data.num);
            if (data.isSuccess) {
              if (sysSource && sysSource == "20") {
                $("#qrCode").html(
                  "<span style=color:#9dc815 onClick=location.href='/guns-vip-main/wap/qrCode?userId='+$('#userId').val()+'&ah='+$('#ah').val();>查看合格证书</span>",
                );
              } else {
                if (data.certificate != 0) {
                  $("#certificate").html(
                    "<span style='color:#9dc815' onClick=\"location.href='/guns-vip-main/wap/certificate?id=" +
                      data.certificate +
                      "&userId=" +
                      $("#userId").val() +
                      "&ah=" +
                      $("#ah").val() +
                      '">点击查看合格证书</span>',
                  );
                }
              }
              $("#title").html("恭喜您，考试通过");
              $("#result_info").removeClass("result_refa");
              $("#result_info").addClass("result_info");
            } else {
              $("#title").html("不好意思，考试未通过");
              $("#result_info").removeClass("result_info");
              $("#result_info").addClass("result_refa");
            }

            $(".result_div").show();
            $("body").css({ "overflow-x": "hidden", "overflow-y": "hidden" });
            updateAnswersFromLog();
          } else {
            layer.alert(result.message);
          }
        },
        error: function () {
          layer.alert("异常！");
        },
      });
      exportQuestionData();
    } else {
      console.warn("未能获取有效的问答数据");
    }
  } catch (error) {
    console.error("获取数据失败:", error);
  }
};

fetchDataAndProcess();
