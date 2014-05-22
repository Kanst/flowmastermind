import datetime
from functools import wraps
import json
import traceback

import msgpack

from cocaine.services import Service
from cocaine.logging import Logger
from flask import Flask, Response, request
from flask import abort, render_template

from flowmastermind.error import ApiResponseError
from flowmastermind.test import ping


logging = Logger()

app = Flask(__name__)


def json_response(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            res = {'status': 'success',
                   'response': func(*args, **kwargs)}
        except ApiResponseError as e:
            logging.error('API error: {0}'.format(e))
            logging.error(traceback.format_exc())
            res = {'status': 'error',
                   'error_code': e.code,
                   'error_message': e.msg}
        except Exception as e:
            logging.error(e)
            logging.error(traceback.format_exc())
            res = {'status': 'error',
                   'error_code': 'UNKNOWN',
                   'error_message': str(e)}

        return JsonResponse(json.dumps(res))

    return wrapper


class JsonResponse(Response):
    def __init__(self, *args, **kwargs):
        super(JsonResponse, self).__init__(*args, **kwargs)
        self.headers['Cache-Control'] = 'no-cache, must-revalidate'
        self.headers['Content-Type'] = 'application/json'


def mastermind_response(response):
    if isinstance(response, dict) and 'Balancer error' in response:
        raise RuntimeError(response['Balancer error'])
    return response


@app.route('/')
def charts():
    try:
        return render_template('charts.html', menu_page='charts')
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/commands/')
def commands():
    try:
        return render_template('commands.html', menu_page='commands',
                                                cur_page='commands')
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/commands/history/')
@app.route('/commands/history/<year>/<month>/')
def history(year=None, month=None):
    try:
        if year is None:
            dt = datetime.datetime.now()
            year, month = dt.year, dt.month
        try:
            dt = datetime.datetime(int(year), int(month), 1)
        except ValueError:
            abort(404)
        return render_template('commands_history.html', year=year,
                                                        month=month,
                                                        menu_page='commands',
                                                        cur_page='history')
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/stat/')
def json_stat():
    try:
        m = Service('mastermind')
        resp = JsonResponse(json.dumps(m.enqueue('get_flow_stats', '').get()))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/commands/')
def json_commands():
    try:
        m = Service('mastermind')
        resp = JsonResponse(json.dumps(m.enqueue('get_commands', '').get()))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/commands/history/<year>/<month>/')
def json_commands_history(year, month):
    try:
        m = Service('mastermind')
        resp = JsonResponse(json.dumps(m.enqueue('minion_history_log',
            msgpack.packb([year, month])).get()))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/map/')
@app.route('/json/map/<namespace>/')
def json_treemap(namespace=None):
    try:
        m = Service('mastermind')
        resp = JsonResponse(json.dumps(m.enqueue('get_groups_tree',
            msgpack.packb([namespace])).get()))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/group/<group_id>/')
def json_group_info(group_id):
    try:
        m = Service('mastermind')
        group_info = m.enqueue('get_couple_statistics',
            msgpack.packb([int(group_id)])).get()
        resp = JsonResponse(json.dumps(group_info))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/commands/status/<uid>/')
@json_response
def json_command_status(uid):
    m = Service('mastermind')
    status = mastermind_response(m.enqueue('get_command',
        msgpack.packb([uid.encode('utf-8')])).get())

    return status


@app.route('/json/commands/execute/node/shutdown/', methods=['POST'])
@json_response
def json_commands_node_shutdown():
    node = request.form.get('node')
    host, port = node.split(':')
    if not node:
        raise ValueError('Node should be specified')
    m = Service('mastermind')
    cmd = mastermind_response(m.enqueue('shutdown_node_cmd',
        msgpack.packb([node.encode('utf-8')])).get())

    resp = mastermind_response(m.enqueue('execute_cmd',
        msgpack.packb([host, cmd, {'node': node}])).get())

    uid = resp.keys()[0]

    return uid


@app.route('/json/commands/execute/node/start/', methods=['POST'])
@json_response
def json_commands_node_start():
    node = request.form.get('node')
    host, port = node.split(':')
    if not node:
        raise ValueError('Node should be specified')
    m = Service('mastermind')
    cmd = mastermind_response(m.enqueue('start_node_cmd',
        msgpack.packb([node.encode('utf-8')])).get())

    resp = mastermind_response(m.enqueue('execute_cmd',
        msgpack.packb([host, cmd, {'node': node}])).get())

    uid = resp.keys()[0]

    return uid


if __name__ == '__main__':
    app.run(debug=True)
