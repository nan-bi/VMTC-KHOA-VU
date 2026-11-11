import React, {useState} from 'react';
import {Button, ConfigProvider, DatePicker, Segmented, Tooltip} from 'antd';
import {LeftOutlined, RightOutlined} from '@ant-design/icons';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
dayjs.locale('vi');

export default function DateControls({range,onChange,disabled=false,hint}) {
  const [mode,setMode]=useState('day');
  const activeMode=disabled&&range[0]!==range[1]?'range':mode;
  const values=range.map(d=>dayjs(d));
  const shift=days=>onChange(range.map(d=>dayjs(d).add(days,'day').format('YYYY-MM-DD')));
  return <ConfigProvider locale={viVN}><div className="date-controls">
    <Segmented aria-label="Cách chọn thời gian" value={activeMode} disabled={disabled}
      options={[{value:'day',label:'Theo ngày'},{value:'range',label:'Khoảng ngày'}]}
      onChange={next=>{setMode(next);if(next==='day')onChange([range[0],range[0]]);}}/>
    <div className="date-inputs">
      {activeMode==='day'?<>
        <Tooltip title="Ngày trước"><Button aria-label="Ngày trước" icon={<LeftOutlined/>} disabled={disabled} onClick={()=>shift(-1)}/></Tooltip>
        <DatePicker aria-label="Ngày báo cáo" value={values[0]} format="DD/MM/YYYY" allowClear={false} disabled={disabled}
          onChange={date=>{if(date)onChange([date.format('YYYY-MM-DD'),date.format('YYYY-MM-DD')]);}}/>
        <Tooltip title="Ngày sau"><Button aria-label="Ngày sau" icon={<RightOutlined/>} disabled={disabled} onClick={()=>shift(1)}/></Tooltip>
      </>:<DatePicker.RangePicker aria-label="Khoảng ngày báo cáo" placeholder={['Từ ngày','Đến ngày']} value={values}
        format="DD/MM/YYYY" allowClear={false} disabled={disabled}
        presets={[{label:'7 ngày từ ngày chọn',value:[values[0],values[0].add(6,'day')]},{label:'Tháng của ngày chọn',value:[values[0].startOf('month'),values[0].endOf('month')]}]}
        onChange={dates=>{if(dates?.[0]&&dates?.[1])onChange(dates.map(d=>d.format('YYYY-MM-DD')));}}/>}
    </div>
    <div className="subtle date-hint">{disabled?'Kỳ của bản báo cáo đã chốt':hint||'Dữ liệu demo: 27/04–25/10/2026 · Khoảng ngày gồm cả ngày kết thúc'}</div>
  </div></ConfigProvider>;
}
