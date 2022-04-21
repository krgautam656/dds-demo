(function ($) {
    'use strict';
    $(function () {
        $('#carouselExampleIndicators').carousel({
            interval: 2000
        })

        let userTable = $('#detailsTable').DataTable({
            'processing': true,
            'serverSide': true,
            'pageLength': 5,
            'lengthMenu': [5, 10, 25, 50, 100],
            'columnDefs': [{
                "defaultContent": "-",
                "targets": "_all"
            }],
            ajax: {
                url: '/users',
                method: "GET",
            },
            columns: [{
                data: null,
                sortable: false,
                render: function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            }, {
                data: null,
                render: function (data, type, row) {
                    return row.firstName + ' ' + row.lastName;
                }
            },
            {
                data: 'gender'
            },
            {
                data: 'email'
            },
            {
                data: 'phoneNumber'
            },
            {
                data: 'dob'
            },
            {
                data: null,
                className: "dt-center editor-edit",
                defaultContent: '<i class="typcn icon typcn-edit h3" style="cursor: pointer;"/>',
                orderable: false
            }
            ]
        })

        var buttons = new $.fn.dataTable.Buttons(userTable, {
            buttons: [{
                extend: 'copyHtml5',
                text: '<i class="fa fa-files-o"></i>',
                titleAttr: 'Copy',
                exportOptions: {
                    columns: 'th:not(:last-child)'
                }
            },
            {
                extend: 'excelHtml5',
                text: '<i class="fa fa-file-excel-o"></i>',
                titleAttr: 'Excel',
                exportOptions: {
                    columns: 'th:not(:last-child)'
                }
            },
            {
                extend: 'csvHtml5',
                text: '<i class="fa fa-file-text-o"></i>',
                titleAttr: 'CSV',
                exportOptions: {
                    columns: 'th:not(:last-child)'
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="fa fa-file-pdf-o"></i>',
                titleAttr: 'PDF',
                exportOptions: {
                    columns: 'th:not(:last-child)'
                }
            }
            ]
        }).container().appendTo($('#user-report-export'));

        $('#detailsTable tbody').on('click', 'td.editor-edit', function () {
            var row = $(this).closest('tr');

            var rowData = userTable.row(row).data();
            $('#firstName').val(rowData.firstName);
            $('#lastName').val(rowData.lastName);
            if (rowData.gender == 'Male') {
                $('#radioMale').prop('checked', true);
                $('#radioMale').val(rowData.gender);
            } else {
                $('#radioFemale').prop('checked', true);
                $('#radioFemale').val(rowData.gender);
            }
            $('#email').val(rowData.email);
            $('#phoneNumber').val(rowData.phoneNumber);
            $("#update-user-dob").val(rowData.dob);
            $('#userDetailsModal').modal('show');
        });

        $("#update-user-dob").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: 'dd/mm/yy'
        });

        $("#add-user-dob").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: 'dd/mm/yy'
        });

        $("#userDetailsForm").validate({
            rules: {
                firstName: "required",
                email: {
                    required: true,
                    email: true
                },
                phoneNumber: {
                    required: true,
                    digits: true,
                    minlength: 10,
                    maxlength: 10,
                },
                gender: {
                    required: true
                }
            },
            messages: {
                firstName: {
                    required: "Please enter first name",
                },
                phoneNumber: {
                    required: "Please enter phone number",
                    digits: "Please enter valid phone number",
                    minlength: "Phone number field accept only 10 digits",
                    maxlength: "Phone number field accept only 10 digits",
                },
                email: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address.",
                },
                dob: {
                    required: "Please select Date of Birth"
                },
                gender: {
                    required: "Please select Gender"
                }
            },
            errorPlacement: function (error, element) {
                if (element.attr("type") == "radio") {
                    error.insertAfter(element.parent('div').next());
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: function (form) {
                $.ajax({
                    type: form.method,
                    url: '/updateUser',
                    data: $(form).serialize(),
                    dataType: "json",
                    success: (response) => {
                        $('#userDetailsModal').modal('hide');
                        userTable.ajax.reload();
                    },
                    error: (jqXHR, textStatus, errorThrown) => {
                        console.log(errorThrown)
                    }
                })
            }
        })

        $('#addUserModal').on('hidden.bs.modal', function () {
            $(this).find('form').trigger('reset');
            $(this).validate().resetForm();
            $('#check').html('')
        })

        $("#new-registration").validate({
            rules: {
                firstName: "required",
                email: {
                    required: true,
                    email: true
                },
                phoneNumber: {
                    required: true,
                    digits: true,
                    minlength: 10,
                    maxlength: 10,
                },
                password: {
                    required: true,
                    minlength: 5,
                },
                confirmPassword: {
                    required: true,
                    minlength: 5,
                    equalTo: '#password'
                },
                gender: {
                    required: true
                },
                address: {
                    minlength: 3,
                },
                city: {
                    minlength: 3,
                },
                state: {
                    minlength: 3,
                },
                pinCode: {
                    digits: true,
                    minlength: 6,
                    maxlength: 6,
                }
            },
            messages: {
                firstName: {
                    required: "Please enter first name",
                },
                phoneNumber: {
                    required: "Please enter phone number",
                    digits: "Please enter valid phone number",
                    minlength: "Phone number field accept only 10 digits",
                    maxlength: "Phone number field accept only 10 digits",
                },
                email: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address.",
                },
                password: {
                    required: "Please enter password"
                },
                confirmPassword: {
                    required: "Please enter confirm password"
                },
                dob: {
                    required: "Please select Date of Birth"
                },
                gender: {
                    required: "Please select Gender"
                }
            },
            errorPlacement: function (error, element) {
                if (element.attr("type") == "radio") {
                    error.insertAfter(element.parent('div').next());
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: function (form, e) {
                e.preventDefault();
                $.ajax({
                    type: form.method,
                    url: '/register',
                    data: $(form).serialize(),
                    dataType: "json",
                    success: (response) => {
                        $('#addUserModal').modal('hide');
                        userTable.ajax.reload();
                        $(window).scrollTop(0);
                    },
                    error: (jqXHR, textStatus, errorThrown) => {
                        $(window).scrollTop(0);
                        $('#check').removeClass('text-success')
                        $('#check').addClass('text-danger')
                        $('#check').html(jqXHR.responseJSON.message)
                    }
                })
            }
        })

        window.setInterval(function () {
            $.getJSON("/getSensorNotification", function (response) {
                if (typeof response.name != "undefined" && response.name != '') {
                    $('#notification-count').html(parseInt($('#notification-count').html(), 10) + 1);

                    var html = '<a class="dropdown-item preview-item"><div class="preview-thumbnail"><div class="preview-icon bg-warning"><i class="typcn typcn-info-large mx-0"></i></div></div>'
                        + '<div class="preview-item-content">'
                        + '<h6 class="preview-subject font-weight-normal">The temperature in the ' + response.name + ' reaches its highest point.</h6>'
                        + '<p class="font-weight-light small-text mb-0"><button type="button" onclick="controlTemperature(\'' + response.name + '\',this);" class="btn btn-primary btn-sm" style="padding: 5px 0px 3px 10px;background-color: #ff8300;border-color: #ff8300;">TEMP <i class="typcn icon typcn-arrow-down"></i></button></p>'
                        + '</div></a>';

                    $('#add-new-notification').prepend(html);

                    toastr.options = {
                        "closeButton": true,
                        "debug": false,
                        "newestOnTop": true,
                        "progressBar": true,
                        "positionClass": "toast-bottom-right",
                        "preventDuplicates": false,
                        "showDuration": "300",
                        "hideDuration": "1000",
                        "timeOut": "5000",
                        "extendedTimeOut": "1000",
                        "showEasing": "swing",
                        "hideEasing": "linear",
                        "showMethod": "fadeIn",
                        "hideMethod": "fadeOut"
                    }
                    toastr["warning"]('The temperature in the ' + response.name + ' reaches its highest point.');
                }
            });
        }, 1000);

    });
})(jQuery);

function controlTemperature(name, element) {
    $.getJSON('/controlTemperature',
        {
            name: name,
        }
    );
    $(element).hide();
}


