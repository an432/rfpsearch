function getDataFromTable() {
	var category = $.request.parameters.get('Category');
	var top_n = $.request.parameters.get('top_n');
	var s_text = $.request.parameters.get('s_text');
	// var s_parameters = 'textSearch=compare, andThreshold=0.3,stopwordTable=\"RFP\".\"RFPSTOPWORDS\", stopwordListId=rfp';
	var s_parameters = 'textSearch=compare, andThreshold=0.3';
	var conn = $.db.getConnection();
	var pstmt;
	var rs;
	var query;

	// начало XML-файла
	var body = '<?xml version="1.0" encoding="utf-8"?><vote>';

	try {

		// Шаблон запроса
		query = 'SELECT TOP ? TO_DECIMAL(score(),3,2) SCO, QUESTION, ANSWER, AUTHOR FROM \"rfpTexts\" where \"CATEGORY\"=? ';
		query = query
				+ ' and contains ((\"QA\"), ?, FUZZY(0.6, ?) ) order by SCO desc';

		// Заполняем запрос параметрами
		pstmt = conn.prepareStatement(query);
		pstmt.setString(1, top_n);
		pstmt.setString(2, category);
		pstmt.setString(3, s_text);
		pstmt.setString(4, s_parameters);

		// Отправляем запрос в БД и получаем ответ в виде массива
		rs = pstmt.executeQuery();

		var rsmd = rs.getMetaData();
		var numColumns;
		var cols;
		var i;
		var tag;

		while (rs.next()) {

			// Раскручиваем массив в XML-текст
			numColumns = rsmd.getColumnCount();
			cols = '';
			i = 1;
			for (i; i < numColumns + 1; i++) {
				tag = rsmd.getColumnLabel(i).toLowerCase();
				cols = cols + "<" + tag + ">" + rs.getString(i) + "</" + tag
						+ ">";
			}
			body = body + cols;
		}
		// Закрываем XML тегом vote (vote - ничего не значит, так исторически
		// сложилось :)
		body = body + "</vote>";
		rs.close();
		pstmt.close();
		conn.close();
	} catch (e) {
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(e.message);
		return;
	}

	// отправляем ответ
	$.response.contentType = 'application/xml; charset=utf-8';
	$.response.setBody(body);
	$.response.status = $.net.http.OK;
}

var aCmd = $.request.parameters.get('cmd');
switch (aCmd) {
case "select":
	getDataFromTable();
	break;
default:
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.setBody('Invalid Command: ', aCmd);
}