var Jobs = (function () {

    var commands = Commands($('.jobs-containers'));

    function Jobs() {
        this.jobs = {};
        this.eventer = $('<i>');
    };

    Jobs.prototype.update = function(uid, state) {
        if (this.jobs[uid] == undefined) {
            this.jobs[uid] = {};
            this.eventer.trigger("create", [uid, state]);
        }

        this.eventer.trigger("update", [uid, state]);

        // update state
    };

    function JobsView(eventer) {
        this.eventer = eventer;

        this.container = $('.jobs-containers');
        this.not_approved_cont = this.container.find('#jobs-not-approved');
        this.executing_cont = this.container.find('#jobs-executing');
        this.finished_cont = this.container.find('#jobs-finished');
        this.job_action_pb = $('.job-action-pb');
        this.job_list_empty = $('.job-list-empty');

        var self = this;

        $(document).keydown(function (event) {
            if (event.which == 27) {
                self.closeCmdStatus();
            }
        });

        $(document).mouseup(function (event) {
            self.closeCmdStatus();
        });

        this.container.find('label').on('click', function () {
            var type = $(this).parent().attr('class').substr(5);
            PseudoURL.setParam('type', type).setParam('job_id', null);
            PseudoURL.load();
            return false;
        });
    }

    JobsView.prototype.taskTitle = function(state) {
        var title = '';
        if (state['type'] == 'move_job') {
            title = 'Переезд группы ' + state['group'] + ' ' +
                    'с хоста <span class="composite-line">' + state['src_hostname'] +
                    ':' + state['src_port'] +
                    (state['src_backend_id'] != undefined ? '/' + state['src_backend_id'] : '') +
                    '<span class="composite-line-sub">' + state['src_host'] + '</span></span> ' +
                    'на хост <span class="composite-line">' + state['dst_hostname'] +
                    ':' + state['dst_port'] +
                    (state['dst_backend_id'] != undefined ? '/' + state['dst_backend_id'] : '') +
                    '<span class="composite-line-sub">' +
                    state['dst_host'] + '</span></span>';
        } else if (state['type'] == 'recover_dc_job') {
            title = 'Восстановление ключей группы ' + state['group'] + ' ' +
                    'на хосте <span class="composite-line">' + state['hostname'] +
                    ':' + state['port'] +
                    (state['backend_id'] != undefined ? '/' + state['backend_id'] : '') +
                    '<span class="composite-line-sub">' + state['host'] + '</span></span>' +
                    (state['keys'] ? ', ключей в группах: [' + state['keys'].join(', ') + ']' : '');
        }
        return title;
    };

    JobsView.prototype.renderTime = function(value, label_field, value_field) {
        if (value != null) {
            label_field.css({visibility: 'visible'});
            value_field.css({visibility: 'visible'});
            value_field.text(value);
        } else {
            label_field.css({visibility: 'hidden'});
            value_field.css({visibility: 'hidden'});
        }
    };

    JobsView.prototype.createJob = function(event, uid, state) {

        var job = $('<div class="job">'),
            job_desc_cont = $('<div class="job-description-container">').appendTo(job)
            job_desc = $('<div class="job-description">').appendTo(job_desc_cont),
            job_title = $('<div class="job-title">').appendTo(job_desc),
            job_create_time_label = $('<div class="job-create-time-label">').appendTo(job_desc),
            job_create_time_val = $('<div class="job-create-time-val">').appendTo(job_desc),
            job_start_time_label = $('<div class="job-start-time-label">').appendTo(job_desc),
            job_start_time_val = $('<div class="job-start-time-val">').appendTo(job_desc),
            job_finish_time_label = $('<div class="job-finish-time-label">').appendTo(job_desc),
            job_finish_time_val = $('<div class="job-finish-time-val">').appendTo(job_desc),
            job_management = $('<div class="job-management">').appendTo(job_desc),
            job_id = $('<div class="job-id">').appendTo(job_management),
            job_management_btns = $('<div class="job-management-btns">').appendTo(job_management),
            task_list = $('<div class="job-tasklist">').appendTo(job);

        job.attr('uid', uid);

        job_title.html(this.taskTitle(state));

        job_create_time_label.text('Создание:');
        job_start_time_label.text('Начало:');
        job_finish_time_label.text('Конец:');

        // job_desc.dblclick(function (e) { console.log(e); e.preventDefault(); });
        job_desc_cont.on('click', function (task_list) { return function () {
            if (task_list.css('display') == 'block') {
                task_list.css('display', 'none');
            } else {
                task_list.css('display', 'block');
            }
            return false;
        }}(task_list));

        for (idx in state['tasks']) {
            this.createTask(task_list, state['tasks'][idx]);
        }

        job_id.text('id: ' + uid);

        job.appendTo(this.executing_cont);
    };

    JobsView.prototype.createTask = function(task_list, task_state) {
        var task = $('<div class="task">'),
            task_status_icon = $('<div class="task-status-icon">').appendTo(task),
            task_title = $('<div class="task-title">').appendTo(task),
            task_maintitle = $('<div class="task-maintitle">').appendTo(task_title),
            task_subtitle = $('<div class="task-subtitle">').appendTo(task_title),
            task_time = $('<div class="task-time">').appendTo(task),
            task_start_time_label = $('<div class="task-start-time-label">').appendTo(task_time),
            task_start_time_val = $('<div class="task-start-time-value">').appendTo(task_time),
            task_finish_time_label = $('<div class="task-finish-time-label">').appendTo(task_time),
            task_finish_time_val = $('<div class="task-finish-time-value">').appendTo(task_time),
            task_additional_data = $('<div class="task-additional-info">').appendTo(task),
            task_management = $('<div class="task-management">').appendTo(task);

        task_start_time_label.text('Начало:');
        task_finish_time_label.text('Конец:');

        this.renderCustomTaskFields(task_state, task_maintitle, task_subtitle, task_additional_data);

        task.appendTo(task_list);
    };

    JobsView.prototype.successNotification = function (notification) {
        $(notification).addClass('o-notification-success');
    };

    JobsView.prototype.errorNotification = function (notification) {
        $(notification).addClass('o-notification-error');
    };

    JobsView.prototype.renderError = function (error) {
        var msg = error['msg'];
        if (error.code == 22) {
            msg = 'Некоторые из групп уже участвуют в задаче ' + error.holder_id;
        }
        return msg;
    };

    JobsView.prototype.renderApiError = function (error) {
        var msg = error['error_message'];
        return msg;
    };

    JobsView.prototype.updateJobBtns = {
        approve: {
            text: 'добро!',
            url: '/json/jobs/approve/{job_id}/',
            postprocess: function (self, state) {
                if (state['status'] == 'not_approved') {
                    var last_error = state['error_msg'][state['error_msg'].length - 1];
                    window.oNotifications.createNotification({
                        title: 'Огого!',
                        text: self.renderError(last_error),
                        onBeforeShow: self.errorNotification});
                }
            }
        },
        cancel: {
            text: 'отменить',
            url: '/json/jobs/cancel/{job_id}/'
        }
    };

    JobsView.prototype.statusButtons = {
        broken: ['cancel'],
        pending: ['cancel'],
        not_approved: ['approve', 'cancel']
    };

    JobsView.prototype.renderJobButtons = function(job, uid, job_management_btns, state) {
        var self = this;

        if (self.statusButtons[state['status']] == undefined) {
            job_management_btns.empty();
        } else if (status != state['status']) {

            job_management_btns.empty();

            var btn_ids = self.statusButtons[state['status']];
            for (var i = 0; i < btn_ids.length; i++) {
                var btn_data = self.updateJobBtns[btn_ids[i]],
                    btn = $('<a href="#" class="task-management-btn">').appendTo(job_management_btns);

                btn.text(btn_data.text);
                function process(btn_data, job_id, job_management_btns) {
                    return function () {
                        job_management_btns.empty();
                        job_management_btns.append(self.job_action_pb.clone());
                        $.ajax({
                            url: btn_data.url.replace('{job_id}', job_id),
                            data: {ts: new Date().getTime()},
                            timeout: 3000,
                            dataType: 'json',
                            success: function (response) {
                                if (response['status'] == 'success') {
                                    var new_state = response['response'];
                                    self.updateJob({}, new_state.id, new_state);
                                    if (btn_data.postprocess) {
                                        btn_data.postprocess(self, new_state);
                                    }
                                } else {
                                    window.oNotifications.createNotification({
                                        title: 'Что-то пошло не так!',
                                        text: self.renderApiError(response),
                                        onBeforeShow: self.errorNotification});
                                    self.renderJobButtons(job, uid, job_management_btns, state);
                                }
                            },
                            error: function (response) {
                                window.oNotifications.createNotification({
                                        title: 'Что-то пошло не так!',
                                        text: self.renderApiError(response),
                                        onBeforeShow: self.errorNotification});
                                self.renderJobButtons(job, uid, job_management_btns, state);
                            }
                        });
                        return false;
                    }
                }
                btn.on('click', process(btn_data, uid, job_management_btns));
            }
        }
    };

    JobsView.prototype.updateJob = function(event, uid, state) {
        var self = this,
            job = this.container.find('.job[uid=' + uid + ']'),
            job_create_time_label = job.find('.job-create-time-label'),
            job_create_time_val = job.find('.job-create-time-val'),
            job_start_time_label = job.find('.job-start-time-label'),
            job_start_time_val = job.find('.job-start-time-val'),
            job_finish_time_label = job.find('.job-finish-time-label'),
            job_finish_time_val = job.find('.job-finish-time-val'),
            job_management_btns = job.find('.job-management-btns'),
            task_list = job.find('.job-tasklist'),
            status = job.attr('status');

        var job_status_cls = 'job-status-' + state['status'];
        job.removeClass().addClass('job').addClass(job_status_cls);

        // TODO: think about when to do insertAfter
        // and maybe fix this in commands_view.js as well
        if (state['status'] == 'completed' || state['status'] == 'cancelled') {
            if (!job.parent().hasClass('jobs-finished')) {
                job_management_btns.css('visibility', 'visible');
                job.prependTo(this.finished_cont);
            }
        } else if (state['status'] == 'not_approved') {
            if (!job.parent().hasClass('jobs-not-approved')) {
                job_management_btns.css('visibility', 'visible');
                job.prependTo(this.not_approved_cont);
            }
        } else {
            if (!job.parent().hasClass('jobs-executing')) {
                job_management_btns.css('visibility', 'visible');
                job.prependTo(this.executing_cont);
            }
        }

        self.renderJobButtons(job, uid, job_management_btns, state);

        this.updateContainers();

        this.renderTime(state['create_ts'], job_create_time_label, job_create_time_val);
        this.renderTime(state['start_ts'], job_start_time_label, job_start_time_val);
        this.renderTime(state['finish_ts'], job_finish_time_label, job_finish_time_val);

        job.attr('status', state['status']);

        if (state['error_msg'] && state['error_msg'].length) {
            self.updateJobErrors(task_list, state['error_msg'].reverse());
        } else {
            task_list.find('.job-errorlist').remove();
        }

        var tasks = job.find('.task');
        for (idx in state['tasks']) {
            this.updateTask(tasks[idx], state['tasks'][idx], state['status'] == 'pending' || state['status'] == 'broken');
        }
    };

    JobsView.prototype.updateJobErrors = function(task_list, errors) {
        var self = this,
            error_list = task_list.find('.job-errorlist');
        if (error_list.length == 0) {
            error_list = $('<div class="job-errorlist">').prependTo(task_list);
            var error_list_header = $('<div class="job-errorlist-header">').appendTo(error_list),
                error_list_last = $('<div class="job-errorlist-last">').appendTo(error_list),
                more_btn = $('<a href="#" class="job-errorlist-showmore-btn">').appendTo(error_list);
                error_list_more = $('<div class="job-errorlist-more">').appendTo(error_list),
            error_list_more.css('display', 'none');
            error_list_header.text('Ошибки:');

            more_btn.css('display', 'none');
            more_btn.text('...');
            more_btn.on('click', function () {
                error_list_more.css('display', 'block');
                more_btn.remove();
                return false;
            });
        } else {
            var error_list_header = error_list.find('.job-errorlist-header'),
                error_list_last = error_list.find('.job-errorlist-last'),
                more_btn = error_list.find('.job-errorlist-showmore-btn'),
                error_list_more = error_list.find('.job-errorlist-more');
        }

        function make_job_error(error) {
            var job_error = $('<div class="job-error">'),
                job_error_ts = $('<div class="job-error-ts">').appendTo(job_error),
                job_error_msg = $('<div class="job-error-msg">').appendTo(job_error);

            job_error_ts.text(error['ts'] + ':');
            job_error_msg.text(self.renderError(error));
            return job_error;
        }

        var errors_count = error_list_last.children().length + error_list_more.children().length;

        for (var i = errors.length - errors_count - 1; i >= 0; i--) {
            make_job_error(errors[i]).prependTo(error_list_last);
        }

        if (error_list_last.children().length > 5 && error_list_more.css('display') == 'none') {
            more_btn.css('display', 'block');
        }

        var error_list_last_messages = error_list_last.children();
        for (var i = error_list_last_messages.length - 1; i >= 5; i--) {
            $(error_list_last_messages[i]).prependTo(error_list_more);
        }
    };

    JobsView.prototype.updateTask = function(task_div, task_state, manageable) {
        var self = this,
            task = $(task_div),
            job_id = task.parents('.job').attr('uid'),
            task_start_time_label = task.find('.task-start-time-label'),
            task_start_time_val = task.find('.task-start-time-value'),
            task_finish_time_label = task.find('.task-finish-time-label'),
            task_finish_time_val = task.find('.task-finish-time-value'),
            task_additional_data = task.find('.task-additional-info'),
            task_status_icon = task.find('.task-status-icon'),
            task_management = task.find('.task-management');

        var task_status_cls = 'task-status-' + task_state['status'];
        task.removeClass().addClass('task').addClass(task_status_cls);

        this.renderTime(task_state['start_ts'], task_start_time_label, task_start_time_val);
        this.renderTime(task_state['finish_ts'], task_finish_time_label, task_finish_time_val);

        var icon_hint = '';
        switch (task_state['status']) {
            case 'unknown': icon_hint = 'странный'; break;
            case 'queued': icon_hint = 'в очереди'; break;
            case 'executing': icon_hint = 'обрабатывается'; break;
            case 'failed': icon_hint = 'сломалось'; break;
            case 'skipped': icon_hint = 'пропущено'; break;
            case 'completed': icon_hint = 'готово'; break;
        }
        task_status_icon.attr('title', icon_hint);

        if (task_state['minion_cmd_id'] && task_additional_data.find('.task-cmd-status').length == 0) {
            var cmd_view = $('<a href="#" class="task-cmd-status">').appendTo(task_additional_data),
                self = this;

            cmd_view.text('статус');

            cmd_view.on('click', function () {

                self.closeCmdStatus();

                var task_cmd_state = $('<div class="task-cmd-stat">').appendTo(task_additional_data);

                $.ajax({
                    url: '/json/commands/status/' + task_state['minion_cmd_id'] + '/',
                    data: {ts: new Date().getTime()},
                    timeout: 3000,
                    dataType: 'json',
                    success: function (response) {

                        if (response['status'] == 'success') {
                            var cmd_status = response['response'];
                            commands.view.createCmd(undefined, task_state['host'], task_state['id'], cmd_status, task_cmd_state);
                            commands.view.updateCmd(undefined, task_state['host'], task_state['id'], cmd_status);

                            var closeBtn = $('<div>').addClass('close')
                                .on('click', function () { task_cmd_state.remove(); })
                                .text('X')
                                .appendTo(task_cmd_state);

                            task_cmd_state.mouseup(function (e) {
                                e.stopPropagation();
                            });

                            function updateCmdStatus() {

                                if (cmd_status.progress < 1.0) {
                                    // setting cmd status updater

                                    $.ajax({
                                        url: '/json/commands/status/' + task_state['minion_cmd_id'] + '/',
                                        data: {ts: new Date().getTime()},
                                        timeout: 3000,
                                        dataType: 'json',
                                        success: function (response) {
                                            if (response['status'] == 'success') {
                                                cmd_status = response['response'];
                                                commands.view.updateCmd(undefined, task_state['host'], task_state['id'], cmd_status);
                                            }
                                            setTimeout(updateCmdStatus, 3000);
                                        },
                                        error: function () {
                                            setTimeout(updateCmdStatus, 3000);
                                        }
                                    });

                                }
                            }

                            setTimeout(updateCmdStatus, 3000);
                        }
                    }
                });

                return false;
            });
        }

        if (task_state['status'] == 'failed' && manageable) {
            if (task_management.children().length == 0) {
                var retry_btn = $('<a href="#" class="task-management-btn">').appendTo(task_management),
                    // br = $('<br>').appendTo(task_management),
                    skip_btn = $('<a href="#" class="task-management-btn">').appendTo(task_management);
                retry_btn.text('перезапустить');
                skip_btn.text('пропустить');

                function applyAction(action, job_id, task_id) {
                    return function () {
                        $.ajax({
                            url: '/json/jobs/' + action + '/' + job_id + '/' + task_id + '/',
                            data: {ts: new Date().getTime()},
                            timeout: 3000,
                            dataType: 'json',
                            success: function (response) {
                                if (response['status'] == 'success') {
                                    var state = response['response'];
                                    self.updateJob({}, state.id, state);
                                }
                            }
                        });
                        return false;
                    }
                }

                retry_btn.on('click', applyAction('retry', job_id, task_state.id));
                skip_btn.on('click', applyAction('skip', job_id, task_state.id));
            }
        } else {
            task_management.empty()
        }
    };

    JobsView.prototype.renderCustomTaskFields = function(task_state, task_maintitle, task_subtitle, task_additional_data) {
        if (task_state['type'] == 'minion_cmd' ||
            task_state['type'] == 'node_stop_task' ||
            task_state['type'] == 'recover_dc_group_task') {
            this.renderMinionCmdFields(task_state, task_maintitle, task_subtitle, task_additional_data);
        } else if (task_state['type'] == 'history_remove_node') {
            this.renderHistoryRemoveNodeFields(task_state, task_maintitle, task_subtitle, task_additional_data);
        } else {
            console.log('Unknown task type: ' + task_state['type']);
        }
    };

    JobsView.prototype.renderMinionCmdFields = function(task_state, task_maintitle, task_subtitle, task_additional_data) {
        task_maintitle.text(task_state['cmd']);
        task_maintitle.attr('title', task_state['cmd']);
        task_subtitle.html('таск миньона на хосте <span class="composite-line">' +
            task_state['hostname'] + '<span class="composite-line-sub">' +
            task_state['host'] + '</span></span>');
    };

    JobsView.prototype.closeCmdStatus = function () {
        this.container.find('.task-cmd-stat').remove();
    };

    JobsView.prototype.renderHistoryRemoveNodeFields = function(task_state, task_maintitle, task_subtitle, task_additional_data) {
        var cleantitle = 'отвязывание ноды ' + task_state['hostname'] + ':' +
                        task_state['port'] + ' (' + task_state['host'] + ') ' +
                        'от группы ' + task_state['group'];
        if (task_state['backend_id'] != undefined) {
            cleantitle = 'отвязывание бэкенда ' + task_state['hostname'] + ':' +
                        task_state['port'] + '/' + task_state['backend_id'] + ' (' +
                        task_state['host'] + ') ' + 'от группы ' + task_state['group'];
        }
        task_maintitle.html(cleantitle);
        task_maintitle.attr('title', cleantitle);
        task_subtitle.text('очистка истории');
    }

    JobsView.prototype.updateContainers = function() {
        var containers = [this.not_approved_cont, this.executing_cont, this.finished_cont];
        for (var idx in containers) {
            var container = containers[idx];

            if (container.find('.job').length != 0 &&
                container.find('.job-list-empty').length != 0) {
                container.find('.job-list-empty').remove();
            } else if (container.find('.job').length == 0 &&
                       container.find('.job-list-empty').length == 0) {
                container.append(this.job_list_empty.clone());
            }
        }
    };

    JobsView.prototype.checkHash = function() {
        var self = this,
            type = PseudoURL.params['type'] || 'not-approved',
            job_id = PseudoURL.params['job_id'];

        if (type) {
            var radio = this.container.find('#tab-switch-jobs-' + type);
            radio.prop('checked', true);

            self.container.find('.tab-content').each(function () {
                var $this = $(this);
                console.log($this.attr('id'));
                if ($this.attr('id') == 'jobs-' + type) {
                    $this.css('display', 'block');
                } else {
                    $this.css('display', 'none');
                }
            });
        }
    }

    var jobs = new Jobs();
    var view = new JobsView(jobs.eventer);

    view.eventer.on("create", view.createJob.bind(view));
    view.eventer.on("update", view.updateJob.bind(view));

    $(window).on('hashchange', function () {
        PseudoURL.parse(window.location.hash);
        view.checkHash();
    });

    view.checkHash();

    return {
        model: jobs,
        view: view
    }
})();