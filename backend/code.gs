// ⚠️ 請務必修改此處！將 "YOUR_FOLDER_ID_HERE" 替換為您 Google Drive "MO_Image" 資料夾的 ID
const IMAGE_FOLDER_ID = "1rBZhbtGoqA6H-dZgdicjZ9PfuhLeQ_4l";

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "query_orders") {
    return queryOrders(e);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid JSON" })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = data.action;
  
  if (action === "issue_order") {
    return issueOrder(data);
  } else if (action === "qc_record") {
    return qcRecord(data);
  } else if (action === "start_work") {
    return startWork(data);
  } else if (action === "finish_work") {
    return finishWork(data);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
}

// 取得 Sheet 物件
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    // 自動建立工作表如果不存在
    sheet = ss.insertSheet(name);
    if (name === "製令前準備紀錄") {
      sheet.appendRow(["製令編號", "製令發出時間", "首件檢驗時間"]);
    } else if (name === "製令資料") {
      sheet.appendRow(["ID", "製令編號", "開工時間", "完工時間", "數量"]);
    }
  }
  return sheet;
}

// 輔助函式：儲存圖片
// 輔助函式：儲存圖片
function saveImage(orderId, base64Data) {
  try {
    if (!base64Data) return { success: true, url: null };
    
    // Default to jpeg
    let mimeType = MimeType.JPEG;
    let extension = "jpg";

    // Detect header
    if (base64Data.includes("data:image/png;")) {
      mimeType = MimeType.PNG;
      extension = "png";
    } else if (base64Data.includes("data:image/jpeg;")) {
      mimeType = MimeType.JPEG;
      extension = "jpg";
    }

    const parts = base64Data.split(",");
    const data = parts.length > 1 ? parts[1] : parts[0];
    
    const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, orderId + "." + extension);
    const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
    
    // Check if file exists and delete it? No, just create new.
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: file.getDownloadUrl() };
  } catch (e) {
    Logger.log("Save Image Error: " + e.toString());
    return { success: false, error: e.toString() };
  }
}

// 輔助函式：取得圖片 URL
function getImageUrl(orderId) {
  try {
    const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
    // Try common extensions
    const extensions = ["jpg", "png", "jpeg"];
    
    for (let i = 0; i < extensions.length; i++) {
        const files = folder.getFilesByName(orderId + "." + extensions[i]);
        if (files.hasNext()) {
            const file = files.next();
            // Option 3: Return Base64 Data URI (Most robust, bypasses all cookie/permission/link issues)
            const blob = file.getBlob();
            const b64 = Utilities.base64Encode(blob.getBytes());
            return "data:" + blob.getContentType() + ";base64," + b64;
        }
    }
    return null;
  } catch (e) {
    Logger.log("Get Image Error: " + e.toString());
    return null;
  }
}

// 1. 製令發出
function issueOrder(data) {
  const orderId = data.orderId;
  const imageBase64 = data.image; // New parameter

  if (!orderId) return errorResponse("缺少製令編號");

  const sheet = getSheet("製令前準備紀錄");
  const rows = sheet.getDataRange().getValues();
  
  // 檢查是否已存在
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(orderId)) {
      return errorResponse("此製令已存在！");
    }
  }

  // Save Image
  if (imageBase64) {
    const saveResult = saveImage(orderId, imageBase64);
    if (!saveResult.success) {
        return errorResponse("圖片儲存失敗：" + saveResult.error);
    }
  }

  const timestamp = new Date();
  sheet.appendRow([orderId, timestamp, ""]);
  return successResponse("製令發出成功！");
}

// 2. 製令品檢
function qcRecord(data) {
  const orderId = data.orderId;
  if (!orderId) return errorResponse("缺少製令編號");

  const sheet = getSheet("製令前準備紀錄");
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let issueTime = "";

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(orderId)) {
      rowIndex = i + 1; // 1-based index
      issueTime = rows[i][1]; // Column B
      // 檢查是否已有 QC 時間 (Column C is index 2)
      if (rows[i][2] !== "") {
        return errorResponse("此製令首件檢驗時間已存在！如有問題，請聯絡開發人員確認。");
      }
      break;
    }
  }

  if (rowIndex === -1) {
    return errorResponse("不存在此製令！請聯絡製造助理確認。");
  }

  const timestamp = new Date();
  sheet.getRange(rowIndex, 3).setValue(timestamp);
  
  const imageUrl = getImageUrl(orderId);
  
  return successResponse("首件檢驗時間紀錄成功！", {
    orderId: orderId,
    issueTime: issueTime,
    qcTime: timestamp,
    imageUrl: imageUrl
  });
}

// 3.1 製令開工
function startWork(data) {
  const orderId = data.orderId;
  if (!orderId) return errorResponse("缺少製令編號");

  // 檢查準備紀錄
  const prepSheet = getSheet("製令前準備紀錄");
  const prepRows = prepSheet.getDataRange().getValues();
  let prepFound = false;
  let qcTime = "";

  for (let i = 1; i < prepRows.length; i++) {
    if (String(prepRows[i][0]) === String(orderId)) {
      prepFound = true;
      qcTime = prepRows[i][2];
      break;
    }
  }

  if (!prepFound) {
    return errorResponse("不存在此製令！請聯絡製造助理確認。");
  }
  if (qcTime === "") {
    return errorResponse("此製令首件檢驗時間不存在！如有問題，請聯絡品檢人員確認。");
  }

  // 檢查製令資料 - 是否有未完工的
  const dataSheet = getSheet("製令資料");
  const dataRows = dataSheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRows.length; i++) {
    if (String(dataRows[i][1]) === String(orderId)) {
      // Column D is finish time (index 3)
      if (dataRows[i][3] === "") {
        return errorResponse("此製令已開工！如有問題，請聯絡開發人員確認。");
      }
    }
  }

  const timestamp = new Date();
  const id = Utilities.getUuid();
  dataSheet.appendRow([id, orderId, timestamp, "", ""]);
  
  const imageUrl = getImageUrl(orderId);

  return successResponse("製令開工紀錄成功！", {
    orderId: orderId,
    startTime: timestamp,
    imageUrl: imageUrl
  });
}

// 3.2 製令完工
function finishWork(data) {
  const orderId = data.orderId;
  const quantity = data.quantity; 
  
  if (!orderId) return errorResponse("缺少製令編號");
  if (quantity === undefined || quantity === null || quantity < 0 || !Number.isInteger(Number(quantity))) {
    return errorResponse("請輸入有效的數量 (0 或以上的整數)");
  }

  const sheet = getSheet("製令資料");
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let startTime = "";

  // 找沒有完工時間的
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(orderId) && rows[i][3] === "") {
      rowIndex = i + 1;
      startTime = rows[i][2];
      break;
    }
  }

  if (rowIndex === -1) {
    return errorResponse("找不到此製令未開工！如有問題，請聯絡開發人員確認。");
  }

  const timestamp = new Date();
  sheet.getRange(rowIndex, 4).setValue(timestamp); // Finish Time
  sheet.getRange(rowIndex, 5).setValue(quantity);  // Quantity
  
  const imageUrl = getImageUrl(orderId);

  return successResponse("製令完工紀錄成功！", {
    orderId: orderId,
    startTime: startTime,
    finishTime: timestamp,
    quantity: quantity,
    imageUrl: imageUrl
  });
}

// 4. 通用查詢
function queryOrders(e) {
  const dataSheet = getSheet("製令資料");
  const rawData = dataSheet.getDataRange().getValues();
  const rows = rawData.slice(1);

  // 轉換成 JSON Array
  const result = rows.map(row => {
    return {
      id: row[0],
      orderId: row[1],
      startTime: row[2],
      finishTime: row[3],
      quantity: row[4]
    };
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(msg, data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: msg, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 5. 權限測試 (請在編輯器中選取此函式並點選「執行」以授權 Drive 存取)
function testDrivePermission() {
  try {
    const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
    Logger.log("權限正常！成功存取資料夾：" + folder.getName());
  } catch (e) {
    Logger.log("權限測試失敗：" + e.toString());
  }
}
