accessid = ''
accesskey = ''
host = ''
policyBase64 = ''
signature = ''
callbackbody = ''
filename = ''
key = ''
expire = 0
g_object_name = ''
g_object_name_type = ''
now = timestamp = Date.parse(new Date()) / 1000;

function send_request()
{
    var respValue = null;
    var bucketInfoUrl  = $("#getBucketInfoUrlId").val();
    $.ajax({
        type: 'PUT',
        url: bucketInfoUrl,
        dataType: 'json',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify({}),
        success: function (data) { // 返回的RequestResult的json对象
            //alert(data['host']);
            respValue = data;
        }
    });
    return respValue;
};

function check_object_radio() {
    var tt = document.getElementsByName('myradio');
    for (var i = 0; i < tt.length ; i++ )
    {
        if(tt[i].checked)
        {
            g_object_name_type = tt[i].value;
            break;
        }
    }
}

function get_signature()
{
    //可以判断当前expire是否超过了当前时间,如果超过了当前时间,就重新取一下.3s 做为缓冲
    var obj = send_request()
    //var obj = eval ("(" + body + ")");
    host = obj['host']
    policyBase64 = obj['policy']
    accessid = obj['accessid']
    signature = obj['signature']
    expire = parseInt(obj['expire'])
    callbackbody = obj['callback']
    key = obj['dir']
    return true;
};

function random_string(len) {
    len = len || 32;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

function get_suffix(filename) {
    pos = filename.lastIndexOf('.')
    suffix = ''
    if (pos != -1) {
        suffix = filename.substring(pos)
    }
    return suffix;
}

function calculate_object_name(filename)
{
    if (g_object_name_type == 'local_name')
    {
        g_object_name += "${filename}"
    }
    else if (g_object_name_type == 'random_name')
    {
        suffix = get_suffix(filename)
        g_object_name = key + random_string(10) + suffix
    }
    return ''
}

function get_uploaded_object_name(filename)
{
    if (g_object_name_type == 'local_name')
    {
        tmp_name = g_object_name
        tmp_name = tmp_name.replace("${filename}", filename);
        return tmp_name
    }
    else if(g_object_name_type == 'random_name')
    {
        return g_object_name
    }
}

function set_upload_param(up, filename, ret)
{
    if (ret == false)
    {
        ret = get_signature()
    }
    g_object_name = key;
    if (filename != '') { suffix = get_suffix(filename)
        calculate_object_name(filename)
    }
    new_multipart_params = {
        'key' : g_object_name,
        'policy': policyBase64,
        'OSSAccessKeyId': accessid,
        'success_action_status' : '200', //让服务端返回200,不然，默认会返回204
        'callback' : callbackbody,
        'signature': signature,
    };

    up.setOption({
        'url': host,
        'multipart_params': new_multipart_params
    });

    up.start();
}

var uploader = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles',
    //multi_selection: false,
    container: document.getElementById('container'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader.init();
//上传0


var uploader1 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles1',
    //multi_selection: false,
    container: document.getElementById('container1'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId1").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console1').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console1').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console1').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console1').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader1.init();

//上传1


var uploader2 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles2',
    //multi_selection: false,
    container: document.getElementById('container2'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId2").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console2').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console2').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console2').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console2').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader2.init();

var uploader3 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles3',
    //multi_selection: false,
    container: document.getElementById('container3'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId3").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console3').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console3').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console3').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console3').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader3.init();


var uploader4 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles4',
    //multi_selection: false,
    container: document.getElementById('container4'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId4").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console4').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console4').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console4').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console4').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader4.init();


var uploader5 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles5',
    //multi_selection: false,
    container: document.getElementById('container5'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile1').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile1').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId5").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console5').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console5').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console5').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console5').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader5.init();


var uploader6 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles6',
    //multi_selection: false,
    container: document.getElementById('container6'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile1').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile1').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId6").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console6').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console6').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console6').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console6').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader6.init();


var uploader7 = new plupload.Uploader({
    runtimes : 'html5,flash,silverlight,html4',
    browse_button : 'selectfiles7',
    //multi_selection: false,
    container: document.getElementById('container7'),
    flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

    filters: {
        mime_types : [ //只允许上传图片和zip文件
            { title : "Image files", extensions : "jpg,gif,png,bmp" },
            { title : "Zip files", extensions : "zip,rar" }
        ],
        max_file_size : '10mb', //最大只能上传10mb的文件
        prevent_duplicates : true //不允许选取重复文件
    },

    init: {
        PostInit: function() {
            document.getElementById('ossfile1').innerHTML = '';
        },

        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                $('#ossfile1').html('<div id="upload_file_div_id">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    +'<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    +'</div>');
                set_upload_param(uploader, file.name, false);
            });
        },

        BeforeUpload: function(up, file) {
            check_object_radio();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function(up, file) {
            var d = document.getElementById('upload_file_div_id');
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width= 2*file.percent+'px';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传成功';
                var ossUrl  = $("#getOssUrlId").val();
                $.ajax({
                    type: 'PUT',
                    url: ossUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify({"objectName":get_uploaded_object_name(file.name)}),
                    success: function (data) { // 返回的RequestResult的json对象
                        $("#picDivId7").html("<img src=\""+data.url+"\"/>");
                    }
                });
            }
            else if (info.status == 203)
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = '上传到OSS成功，但是oss访问用户设置的上传回调服务器失败，失败原因是:' + info.response;
            }
            else
            {
                document.getElementById('upload_file_div_id').getElementsByTagName('b')[0].innerHTML = info.response;
            }
        },

        Error: function(up, err) {
            if (err.code == -600) {
                document.getElementById('console7').appendChild(document.createTextNode("\n选择的文件太大了,可以根据应用情况，在upload.js 设置一下上传的最大大小"));
            }
            else if (err.code == -601) {
                document.getElementById('console7').appendChild(document.createTextNode("\n选择的文件后缀不对,可以根据应用情况，在upload.js进行设置可允许的上传文件类型"));
            }
            else if (err.code == -602) {
                document.getElementById('console7').appendChild(document.createTextNode("\n这个文件已经上传过一遍了"));
            }
            else
            {
                document.getElementById('console7').appendChild(document.createTextNode("\nError xml:" + err.response));
            }
        }
    }
});

uploader7.init();