import * as moment from './moment.min';
import './moment-timezone-with-data.min';

export function addColorToDelta(str) {
    if (str.includes('second')) {
        return '<span style="color:#FF0030">' + str + '</span>';
    } else if (str.includes('minute')) {
        return '<span style="color:#FF9600">' + str + '</span>';
    } else if (str.includes('hour')) {
        return '<span style="color:#0084FF">' + str + '</span>';
    } else {
        return str;
    }
}

export function generateURLHash(urlParamsMap) {
    let paramHash = '';

    urlParamsMap.forEach(function(value, key) {
        if(value.length === 0)
            return;

        paramHash += key;
        paramHash += '=' + value + '&';
    });

    if(paramHash.charAt(paramHash.length - 1) === '&')
        paramHash = paramHash.substr(0, paramHash.length - 1);

    return paramHash;
}

export function format(row) {
    const data = {
        stepsHtml: formatSteps(row),
        marketDataHtml: formatMarketData(row),
        detailsHtml: formatDetails(row),
        headLoopsHtml: formatHeadLoops(row),
        chartHtml: formatChart(row),
        bestSeqAmount: formatNum(row.best_taker_amount.sequential, 1, 5),
        bestSeqPl: formatNum(row.best_taker_pl.sequential, 100, 2),
        bestParAmount: formatNum(row.best_taker_amount.parallel, 1, 5),
        bestParPl: formatNum(row.best_taker_pl.parallel, 100, 2),
        amountsTicker: row.amounts_ticker,
    };
    $.views.settings.delimiters("[%", "%]");
    const result = $.templates('#details-tpl').render(data);
    $.views.settings.delimiters("{{", "}}");
    return result;
}

function formatNum(num, multiplier, places) {
    const t = Math.pow(10, places)
    return (Math.round(multiplier * num * t) / t).toFixed(places);
}

function formatDetails(row) {
    const m = moment.parseZone(row.dt).local();
    const spread = (row.spread * 100).toFixed(2)

    const date = moment(m);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const rightDate = date.tz(userTimezone).format('MMMM Do YYYY, h:mm:ss a');


    let html = `
        <h3 class="subtitle">${detailsHeading}</h3>
        <ul class="detailsList">
            <li><span>${spreadHeading}:</span> <p>${spread}%</p></li>
            <li><span>${discoveryHeading}:</span> <p>${m.fromNow()} (${rightDate}, timezone ${userTimezone})</p></li>
        </ul>
    `;

    return html;
}

function formatMarketData(row) {
    let html = `
        <h3 class="subtitle">${marketDataHeading}</h3>
    `;

    Object.keys(row.spread_info).forEach((key, i) => {
        if(i > 1)
            return;

        if((typeof(row.spread_info[key]) === 'object') && ('rate' in row.spread_info[key])) {
            html += '<ul class="detailsList2 detailsList2-row">';
            html += `<li><span class="detailsList-zero"></span></li>`;
            html += `<li><span>${rateHeading}:</span></li>`;
            html += `<li><span>${volumeHeading}:</span></li>`;

            html += `<li><p><span>${feeHeadings.maker_fee}:</span></p></li>`;
            html += `<li><p><span>${feeHeadings.taker_fee}:</span></p></li>`;

            html += '</ul>';
        }
    });

    Object.keys(row.spread_info).forEach((key, i) => {
        const vol = Math.round(parseFloat(row.spread_info[key].vol) * 10000) / 10000;
        if((typeof(row.spread_info[key]) === 'object') && ('rate' in row.spread_info[key])) {
            html += '<ul class="detailsList2">';
            html += `<li><h5 class="detailsList__title">${row.spread_info[key].exch} ${row.spread_info[key].a}/${row.spread_info[key].b}</h5>`;
            html += (i === 1) ? `<p>${row.spread_info[key].rate}</p></li>` : `<p>${row.spread_info[key].rate}</p></li>`;
            html += (i === 1) ? `<li><p>${vol} BTC</p></li>` : `<li><p>${vol} BTC</p></li>`;

            const takerFee = (parseFloat(row.signed_spread.fee[row.spread_info[key].exch + ''].taker_fee) * 100).toFixed(2);
            const makerFee = (parseFloat(row.signed_spread.fee[row.spread_info[key].exch + ''].maker_fee) * 100).toFixed(2);

            html += (i === 1) ? `<li><p>${takerFee}%</p></li>` : `<li><p>${takerFee}%</p></li>`;
            html += (i === 1) ? `<li><p>${makerFee}%</p></li>` : `<li><p>${makerFee}%</p></li>`;

            html += '</ul>';
        }
    });

    return html;
}

function formatHeadLoops(row) {
    let html = '<h3 class="subtitle">Loop</h3>';

    row.spread_info.trade.forEach( (item, i) => {
        html += `
              <span class="btn-group" style="display: inline-flex; margin-top: 2px">
                  <button class="btn-sm btn-outline">${item[0]}</button>
                  <button class="btn-sm">${item[1]}</button>
              </span>
        `;
    });
    return html;
}

export function formatSteps(row) {
    var html = '<h3 class="subtitle">Required trades</h3><ul class="StepProgress">';

    if(row && row.trades) {
        Object.keys(row.trades).forEach((key, i) => {
            html += '<li class="StepProgress-item ';

            switch(row.trades[key][0]) {
                case 'buy':
                    html += 'StepProgress-item-pink">';
                    html += '<p><strong>' + 'buy ' + '</strong>&nbsp;&nbsp;';
                    html += '<span class="btn-group" style="display:inline-block">' +
                        '<button class="btn-sm btn-success' +
                        '">' + row.trades[key][1] + '</button><button class="btn-sm btn-outline-success">' +
                        row.trades[key][2] + '/' + row.trades[key][3] + '</button></span></p>';
                    break;
                case 'sell':
                    html += 'StepProgress-item-green">';
                    html += '<p><strong>' + 'sell ' + '</strong>&nbsp;&nbsp;';
                    html += '<span class="btn-group" style="display:inline-block">' +
                        '<button class="btn-sm btn-error' +
                        '">' + row.trades[key][1] + '</button><button class="btn-sm btn-outline-error">' +
                        row.trades[key][2] + '/' + row.trades[key][3] +'</button></span></p>';
                    break;
            }

            html += '</li>';
        });
    }
    html += '</ul>';
    return html;
}

export function preferenceFormSave() {
    $('#savePreferencesForm').on('submit', event => {
        event.preventDefault();

        let data = {};
        $('.prefExclInputDiv').each((i, div) => {
            const key = $(div).children('h3').text();

            data['' + key] = [];
            $(div).find('.preferenceExclInput').each((i, input) => {
                const inputVal = $(input).val();
                if(inputVal)
                    data['' + key].push(inputVal);
            });
        });
    });
}

function formatAmountInput(row) {
    var html = '<h6 class="modal__control--panel">Starting amounts</h6><ul>';
    row.spread_info.trade.forEach( (item, i) => {
        let input_id = item[0] + "_amount_input";
        html += '<li class="dash__modal-input-textbox"><label for=' + input_id + ' class="modal__control--panel">' + item[0] + '/' + item[1] + '</label>';
        html += '<input id=' + input_id + ' type="number" name=' + input_id + ' class="dark-text"/>';
        html += '</li>';
    });
    html += '</ul>'
    return html;
}

export function formatChart(row) {
    let spreadData = {no_fee: [], taker_fee: [], maker_fee: []};
    let xs = [];
    let v = [null];

    if($.isEmptyObject(row.signed_spread)) {
        return '<h5 style="font-size: 14px">No simulations available for this arbitrage opportunity</h5>';
    }

    let sim_type = ['no_fee', 'taker_fee', 'maker_fee'];
    for (let i = 0; i < sim_type.length; i++) {
        for (let j = 0; j < row.amounts.length; j++) {
            spreadData[sim_type[i]].push({
                x: row.amounts[j],
                y: parseFloat(row.signed_spread.spreads[sim_type[i]][j]) * 100,
            });
            if (i === 0) {
                xs.push(parseFloat(row.amounts[j]));
            }
        }
    }

    let data = {
        chartId: 'chart-' + row.DT_RowId,
        xs: JSON.stringify(xs),
        spreadData: JSON.stringify(spreadData),
        amountsTicker: row.amounts_ticker,
        v: v,
        oneFee: row.one_fee,
        loop_markets: JSON.stringify(row.spread_info.trade),
        amount_input_html: formatAmountInput(row),
    };

    $.views.settings.delimiters("[%", "%]");
    let result = $.templates('#pl-chart-tpl').render(data);
    $.views.settings.delimiters("{{", "}}");
    return result;
}

Array.prototype.delayedForEach = function(callback, timeout, thisArg, done){
    var i = 0,
        l = this.length,
        self = this;

    var caller = function() {
        callback.call(thisArg || self, self[i], i, self);
        if(++i < l) {
            setTimeout(caller, timeout);
        } else if(done) {
            setTimeout(done, timeout);
        }
    };

    caller();
};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
