(function($) {
    'use strict';
    $(function() {
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
                    render: function(data, type, row, meta) {
                        return meta.row + meta.settings._iDisplayStart + 1;
                    }
                }, {
                    data: null,
                    render: function(data, type, row) {
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

        $('#detailsTable tbody').on('click', 'td.editor-edit', function() {
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
            $("#datepicker").val(rowData.dob);
            $('#userDetailsModal').modal('show');
        });

        $("#datepicker").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: 'dd/mm/yy'
        });

        setInterval(function() {
            $.ajax({
                url: '/details',
                success: (response) => {
                    if (typeof response.name != "undefined") {
                        console.log(response)
                        userTable.row.add([
                            userTable.data().count() + 1,
                            response.name._text,
                            response.gender._text,
                            response.email._text,
                            response.phonenumber._text,
                            response.dob._text,
                        ]).draw(true)
                    }
                },
                error: (jqXHR, textStatus, errorThrown) => {}
            })
        }, 50000000)

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
            errorPlacement: function(error, element) {
                if (element.attr("type") == "radio") {
                    error.insertAfter(element.parent('div').next());
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: function(form) {
                $.ajax({
                    type: form.method,
                    url: '/updateUser',
                    data: $(form).serialize(),
                    dataType: "json",
                    success: (response) => {
                        console.log('hi')
                        $('#userDetailsModal').modal('hide');
                        userTable.ajax.reload();
                    },
                    error: (jqXHR, textStatus, errorThrown) => {
                        console.log(errorThrown)
                    }
                })
            }
        })

    });
})(jQuery);