<template>
	
	<view class="f-y-bt h100 bf p10" style="padding-top: 0;">
		<view class="f-bt f-y-c search">
			<u--form labelPosition="left" :model="queryForm" ref="uForm" labelWidth="100px" labelAlign="right"
				:labelStyle="{fontSize:'14px'}">
				<u-form-item :label="$t('order.order_type')" prop="appointment" ref="item1"
					v-if="tabval != 'valueRef' && tabval != 'billRef'">
					<view class="sw">
						<uni-data-select v-model="queryForm.appointment" :localdata="channels"
							:placeholder="$t('order.please_select_order_channel')"
							@change="handDiningType"></uni-data-select>
					</view>
				</u-form-item>
				<u-form-item :label="$t('order.state')" ref="item1" v-if="tabval =='inStoreRef'">
					<view class="sw">
						<uni-data-select v-model="queryForm.state" :localdata="states"
							@change="handstate"></uni-data-select>
					</view>
				</u-form-item>
				<u-form-item :label="$t('order.payment_method')" prop="payType" ref="item1">
					<view class="sw">
						<uni-data-select v-model="queryForm.payType"
							:localdata="tabval == 'selfRef' || tabval == 'sideRef'  ? classfiys : classfiy"
							:placeholder="$t('order.please_select_order_source')"
							@change="handSource"></uni-data-select>
					</view>
				</u-form-item>
				<u-form-item :label="$t('order.order_time')" prop="timeType" ref="item1">
					<view class="sw">
						<uni-data-select v-model="queryForm.timeType" :localdata="dates"
							:placeholder="$t('order.please_select')" @change="handDate"
							:clear="false"></uni-data-select>
					</view>
				</u-form-item>
				<u-form-item :label="$t('order.time_type')" prop="timeChannel" ref="item1"
					v-if="tabval != 'billRef' && tabval != 'valueRef'">
					<view class="sw">
						<uni-data-select v-model="queryForm.timeChannel" :localdata="dateTime"
							:placeholder="$t('order.please_select')" @change="handChannel"
							:clear="false"></uni-data-select>
					</view>
				</u-form-item>
				<u-form-item label="" ref="item1" class="ml20">
					<view class="iw">
						<u--input :placeholder="$t('order.please_enter_serial_number')" prefixIcon="search"
							prefixIconStyle="color: #909399" v-model="queryForm.keyword" @input="fetchData"
							clearable></u--input>
					</view>
				</u-form-item>
			</u--form>
		</view>
		<view class="main f-1 f-bt f16" v-if="orderList&&orderList.length>0">
			<view class="f-g-0 f-y-bt left">
				<view class="lwrap f-g-1">
					<view class="list p10 mb10" :class="current == i ? 'lcur':''" v-for="(v,i) in orderList" :key="i"
						@click="clickItem(v,i)">
						<view class="f-bt">
							<view class="wei f20" v-if="tabval == 'valueRef'">{{$t('order.member_stored_value')}}</view>
							<view class="wei f20" v-else-if="tabval == 'integralRef'">{{$t('order.points_mall')}}</view>
							<view class="wei f20" v-else-if="tabval == 'inStoreRef' && v.diningType==4 && v.table">
								{{v.table.type.name}}{{v.table.name}}
							</view>
							<view class="wei f20"
								v-else-if="tabval == 'inStoreRef' && (v.diningType==5 || v.diningType==6)">
								{{$t('order.pickup_number')}}：{{v.pickNo}}
							</view>
							<view class="wei f20" v-else>
								{{tabval == 'selfRef' ? $t('order.pickup_number') :$t('order.serial_number')}}：{{v.pickNo}}
							</view>
							<view class="">
								<view class="f-y-c">{{v.stateFormat || v.stateForamt}}
									<text style="color: #4275F4;" class="f14 ml5"
										v-if="v.orderIndex && v.orderIndex.payStateFormat">({{v.orderIndex && v.orderIndex.payStateFormat}})</text>
								</view>
								<view class="mt5" v-if="v.created_at">
									{{$t('order.order_number')}}：{{v.created_at.substr(11,5)}}
								</view>
							</view>
						</view>
						<view v-if="v.orderSn" class="mt10">{{$t('order.order_tail_number')}}：{{v.orderSn.substr(14,6)}}
						</view>
						<view class="f-bt mt10 f-y-c">
							<view v-if="tabval == 'integralRef'" class="flex">
								{{$t('order.payment_amount')}}：
								<view class="t-o-e wei4" style="color: #4275F4;" v-if="v.goods">
									<text v-if="v.goods.integral>0">{{v.goods.integral}}</text>
									<text v-if="v.goods.integral>0" class="f13 nowei">{{$t('order.points')}}</text>
									<text v-if="v.goods.integral>0 && v.goods.money>0" class="nowei">+</text>
									<text v-if="v.goods.money>0"><text class="f12">฿</text>{{v.goods.money}}</text>
								</view>
							</view>
							<view v-else>{{$t('order.payment_amount')}}：<text
									style="color: #4275F4;">฿{{v.money}}</text></view>
							<view class="f14">
								<text class="iconfont icon-huabanfuben f24" v-if="v.source ==11"></text>
								<text class="iconfont icon-shouyintai  f24" v-if="v.source ==10"></text>
								<text class="iconfont icon-weixinxiaochengxu f24" v-if="v.source ==1"></text>
							</view>
						</view>
					</view>
				</view>
				<view class="bf p-10-0 l_bot f-g-0">
					<uni-pagination :current="queryForm.pageNo" :total="total" @change="change" showIcon />
				</view>
			</view>
			<view class="f-bt f-g-1 right pl10">
		 
				<view class="f-g-0 goods p10"
					v-if="tabval != 'billRef' && tabval != 'valueRef' &&  tabval != 'integralRef'">
					<view class="bbae6 pb10">
						<view class="wei f24">
							<view v-if="tabval == 'inStoreRef' && itemForm.diningType==4 && itemForm.table">
								{{itemForm.table.type.name}}{{itemForm.table.name}}
								<text class="f18 c9 nowei ml10">{{itemForm.tableNum}}人</text>
							</view>
							<view
								v-else-if="tabval == 'inStoreRef' && (itemForm.diningType==5 || itemForm.diningType==6)">
								{{$t('order.pickup_number')}}：{{itemForm.pickNo}}
							</view>
							<view v-else>
								{{tabval == 'selfRef' ? $t('order.pickup_number') :$t('order.serial_number')}}：{{itemForm.pickNo}}
							</view>
						</view>
						<view class="f-bt f-y-c mt10">
							<view class="" style="color: #4275F4;">
								{{$t('order.total')}}{{itemForm.goodsNum}}，{{$t('order.total_amount')}}฿{{itemForm.goodsMoney}}
								<text v-if="itemForm.goodsSellMoney > itemForm.goodsMoney"
									class="t-d-l c9 ml10 f14">฿{{itemForm.goodsSellMoney}}</text>
							</view>
							<view v-if="itemForm.refundFormat" class="cf5f">
								{{itemForm.refundFormat}}
							</view>
						</view>
					</view>
					<view class="f-1 mt10"
						v-if="tabval == 'inStoreRef' && itemForm.generalGoods || itemForm.discountsGoods">
						<block v-for="(v,i) in itemForm.generalGoods" :key="i">
							<view class="f-bt wei mt10 f-y-t">
								<view class="f-g-1 f18 flex f-y-t">
									<block v-if="v.discountLabel">
										<view class="i_tag mr5 f10 cf f-c f-g-0 i_tag2" v-if="v.state==8">
											{{v.discountLabel}}
										</view>
										<view class="i_tag mr5 f10 cf5 f-c f-g-0" v-else>{{v.discountLabel}}</view>
									</block>
									<view class="l-h1 t-o-e2">{{v.name}}</view>
								</view>
								<view class="f-g-0 flex">
									<view class="nowei mr30" v-if="v.weightSwitch==1"> {{(v.price*100).toFixed(2)}}x{{v.num/100}}</view>
									<view class="nowei t-r t-o-e" style="width: 70px;">
										<view>฿{{v.money}}</view>
										<view v-if="v.sellMoney>v.money" class="t-d-l f14 c9">฿{{v.sellMoney}}</view>
									</view>
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5">
								<view v-if="v.attrData && v.attrData.spec">
									[{{ v.attrData.spec }}]</view>
								<view v-if="v.attrData && v.attrData.attr">
									[{{ v.attrData.attr }}]</view>
								<view v-if="v.attrData && v.attrData.matal">
									{{ v.attrData.matal }}
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5" v-if="v.setMealData && v.setMealData.length">
								<view v-for="(cv,ci) in v.setMealData" :key="ci">{{cv.name}}*{{cv.num}}
									<text v-if="cv.attrData && cv.attrData.attr"
										class="ml10">[{{ cv.attrData.attr }}]</text>
									<text v-if="cv.attrData && cv.attrData.matal"
										class="ml10">[{{ cv.attrData.matal }}]</text>
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5 t-o-e2" v-if="v.state==8 && v.discountLabel && v.reason">
								{{$t('order.refund_reason')}}：{{v.reason}}
							</view>
						</block>
						<block v-for="(v,i) in itemForm.discountsGoods" :key="i">
							<view class="f-bt wei mt10 f-y-t">
								<view class="f-g-1 f18 flex f-y-t">
									<view v-if="v.discountLabel" class="i_tag mr5 f10 cf5 f-c f-g-0">{{v.discountLabel}}
									</view>
									<view class="l-h1 t-o-e2">{{v.name}}</view>
								</view>
								<view class="f-g-0 flex">
									<view class="nowei mr30">x{{v.num}}</view>
									<view class="nowei t-r t-o-e" style="width: 70px;">
										<view>฿{{v.money}}</view>
										<view v-if="v.sellMoney>v.money" class="t-d-l f14 c9">฿{{v.sellMoney}}</view>
									</view>
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5">
								<view v-if="v.attrData && v.attrData.spec">
									[{{ v.attrData.spec }}]</view>
								<view v-if="v.attrData && v.attrData.attr">
									[{{ v.attrData.attr }}]</view>
								<view v-if="v.attrData && v.attrData.matal">
									{{ v.attrData.matal }}
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5" v-if="v.setMealData && v.setMealData.length">
								<view v-for="(cv,ci) in v.setMealData" :key="ci">{{cv.name}}*{{cv.num}}
									<text v-if="cv.attrData && cv.attrData.attr"
										class="ml10">[{{ cv.attrData.attr }}]</text>
									<text v-if="cv.attrData && cv.attrData.matal"
										class="ml10">[{{ cv.attrData.matal }}]</text>
								</view>
							</view>
						</block>
					</view>
					<view class="f-1 mt10" v-else>
						<block v-for="(v,i) in itemForm.goods" :key="i">
							<view class="f-bt wei mt10 f-y-t">
								<view class="f-g-1 f18 flex">
									<view v-if="v.discountType" class="i_tag mr5 f10 cf5 f-c f-g-0">{{v.discountLabel}}
									</view>
									{{v.name}}
								</view>
								<view class="f-g-0 flex">
									<view class="nowei mr30">x{{v.num}}</view>
									<view class="nowei t-r t-o-e" style="width: 70px;">
										<view>฿{{v.money}}</view>
										<view v-if="v.sellMoney>v.money" class="t-d-l f14 c9">฿{{v.sellMoney}}</view>
									</view>
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5">
								<view v-if="v.attrData && v.attrData.spec">
									[{{ v.attrData.spec }}]</view>
								<view v-if="v.attrData && v.attrData.attr">
									[{{ v.attrData.attr }}]</view>
								<view v-if="v.attrData && v.attrData.matal">
									{{ v.attrData.matal }}
								</view>
							</view>
							<view class="flex f-w f14 c9 mt5" v-if="v.setMealData && v.setMealData.length">
								<view v-for="(cv,ci) in v.setMealData" :key="ci">{{cv.name}}*{{cv.num}}
									<text v-if="cv.attrData && cv.attrData.attr"
										class="ml10">[{{ cv.attrData.attr }}]</text>
									<text v-if="cv.attrData && cv.attrData.matal"
										class="ml10">[{{ cv.attrData.matal }}]</text>
								</view>
							</view>
						</block>
					</view>
				</view>
				<view class="f-g-0 goods p10" v-if="tabval == 'billRef'">
					<view class="bbae6 pb10">
						<view class="wei f24">
							{{tabval == 'selfRef' || tabval == 'inStoreRef' ? $t('order.pickup_number') :$t('order.serial_number')}}：{{itemForm.pickNo}}
						</view>
						<view class="f-bt f-y-c mt10">
							<view class="" style="color: #4275F4;">
								{{$t('order.total_amount')}}฿{{itemForm.money}}
							</view>
							<view v-if="itemForm.refundMoney>0" class="cf5f">{{$t('order.refunded')}}</view>
						</view>
					</view>
					<view class="f-1 mt10">
						<view class="flex">
							<view>{{$t('order.order_person')}}：</view>
							<view class="flex" v-if="itemForm.admin">
								<view>{{itemForm.admin && itemForm.admin.nickname || '-'}}-</view>
								<view>{{itemForm.admin && itemForm.admin.mobile}}</view>
							</view>
							<!-- <view class="flex" v-if="itemForm.user">
								<view>{{itemForm.user && itemForm.user.nickname || '-'}}-</view>
								<view>{{itemForm.user && itemForm.user.mobile}}</view>
							</view> -->
						</view>
					</view>
				</view>
				<view class="f-g-0 goods p10" v-if="tabval == 'valueRef'">
					<view class="bbae6 pb10">
						<view class="wei f24">{{$t('order.member_stored_value')}}</view>
						<view class="f-bt f-y-c mt10">
							<view class="" style="color: #4275F4;">
								{{$t('order.total_amount')}}฿{{itemForm.money}}
							</view>
						</view>
					</view>
					<view class="f-1 mt10">
						<view class="flex">
							<view>{{$t('order.order_person')}}：</view>
							<view class="flex" v-if="itemForm.admin">
								<view>{{itemForm.admin && itemForm.admin.nickname || '-'}}-</view>
								<view>{{itemForm.admin && itemForm.admin.mobile}}</view>
							</view>
							<view class="flex" v-if="itemForm.user">
								<view>{{itemForm.user && itemForm.user.nickname || '-'}}-</view>
								<view>{{itemForm.user && itemForm.user.mobile}}</view>
							</view>
						</view>
						<view class="f-g-1 mt20">
							<view class="f-bt">
								<view class="f-g-0">{{$t('order.stored_value_amount')}}</view>
								<view class="f-g-1 f-x-e">{{itemForm.money}}</view>
							</view>
							<view class="p10 mt10" style="padding-right: 0;" v-if="itemForm.data">
								<view class="f-bt c6" v-if="itemForm.data.balanceSwitch==1">
									<view class="f-g-0">{{$t('order.gift')}}：{{$t('order.amount')}}</view>
									<view class="f-g-1 f-x-e">฿{{itemForm.data.balanceGive}}</view>
								</view>
								<view class="f-bt mt10 c6" v-if="itemForm.data.integralSwitch==1">
									<view class="f-g-0">{{$t('order.gift')}}：{{$t('order.points')}}</view>
									<view class="f-g-1 f-x-e">{{itemForm.data.integralGive}}</view>
								</view>
								<view class="f-bt mt10 c6" v-if="itemForm.data.couponSwitch==1">
									<view class="f-g-0">{{$t('order.gift')}}：{{$t('order.coupon')}}</view>
									<view class="f-g-1 f-x-e">
										<view>
											<view v-if="itemForm.data.couponGive">
												<block v-for="(v,i) in itemForm.data.couponGive" :key='i'>
													{{v.name}} <text class=""
														:style="{color:'#4275F4'}">x{{v.num}}</text>
												</block>
											</view>
										</view>
									</view>
								</view>
								<view class="f-bt mt10 c6" v-if="itemForm.data.levelSwitch==1">
									<view class="f-g-0">{{$t('order.gift')}}：{{$t('order.member_level_up_to')}}</view>
									<view class="f-g-1 f-x-e">{{itemForm.data.levelGive}}</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				<view class="f-g-0 goods p10" v-if="tabval == 'integralRef'">
					<view class="bbae6 pb10">
						<view class="wei f24" v-if="itemForm.user && itemForm.user.mobile">
							{{$t('order.phone_tail_number')}}{{itemForm.user.mobile.substr(itemForm.user.mobile.length-4)}}
						</view>
						<view class="f-bt f-y-c mt10">
							<view class="flex">
								{{$t('order.total_amount')}}：
								<view class="cfa t-o-e wei4" style="color: #4275F4;" v-if="itemForm.goods">
									<text v-if="itemForm.goods.integral>0">{{itemForm.goods.integral}}</text>
									<text v-if="itemForm.goods.integral>0"
										class="f13 nowei">{{$t('order.points')}}</text>
									<text v-if="itemForm.goods.integral>0 && itemForm.goods.money>0"
										class="nowei">+</text>
									<text v-if="itemForm.goods.money>0"><text
											class="f12">฿</text>{{itemForm.goods.money}}</text>
								</view>
							</view>
							<view v-if="itemForm.refundMoney>0" class="cf5f">{{$t('order.refunded')}}</view>
						</view>
					</view>
					<view class="f-1 mt10">
						<view class="f-bt wei mt10 f-y-t" v-if="itemForm.goods">
							<view class="f-g-1 f18 flex">
								<view v-if="itemForm.goods.discountType" class="i_tag mr5 f10 cf5 f-c f-g-0">
									{{itemForm.goods.discountLabel}}
								</view>
								{{itemForm.goods.name}}
							</view>
							<view class="f-g-0 flex">
								<view class="nowei mr30">x{{itemForm.goods.num || 1}}</view>
								<view class="nowei t-r t-o-e">
									<view class="t-o-e" v-if="itemForm.goods">
										<text v-if="itemForm.goods.integral>0">{{itemForm.goods.integral}}</text>
										<text v-if="itemForm.goods.integral>0"
											class="f13 nowei">{{$t('order.points')}}</text>
										<text v-if="itemForm.goods.integral>0 && itemForm.goods.money>0"
											class="nowei">+</text>
										<text v-if="itemForm.goods.money>0"><text
												class="f12">฿</text>{{itemForm.goods.money}}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				<view class="f-g-1 f-y-bt ml10">
					<view class="order f-g-1 p10">
						<view class="bbae6 pb10">
							<view class="flex">
								<view class="fg0">{{$t('order.order_number')}}:</view>
								<view>{{itemForm.orderSn}}</view>
								<view class="fz ml5" style="color: #4275F4;" @click="handFz(itemForm.orderSn)">复制</view>
							</view>
							<view class="flex mt10" v-if="itemForm.table">
								<view class="fg0">{{$t('order.table_number')}}:</view>
								<view>
									{{itemForm.table.type.name}}{{itemForm.table.name}}
									<text class="f14 c9 nowei ml5">{{itemForm.tableNum}}人</text>
								</view>
							</view>
							<view class="flex mt10">
								<view class="fg0">{{$t('order.order_time')}}:</view>
								<view>{{itemForm.created_at}}</view>
							</view>
							<view class="flex mt10">
								<view class="fg0">{{$t('order.order_channel')}}:</view>
								<view>{{itemForm.sourceFormat||'-'}}</view>
							</view>
							<view class="flex mt10">
								<view class="fg0">{{$t('order.order_remark')}}:</view>
								<view>{{itemForm.notes||'-'}}</view>
							</view>
							<view class="flex mt10">
								<view class="fg0">{{$t('order.store_remark')}}:</view>
								<view>{{itemForm.storeNotes||'-'}}</view>
							</view>
						</view>
						<view class="f-bt mt10">
							<view class="flex f-y-c">
								<view>{{itemForm.sourceFormat || '-'}}</view>
								<view class="line"></view>
								<view v-if="tabval == 'valueRef'">{{$t('order.stored_value_order')}}</view>
								<view v-else-if="tabval == 'inStoreRef'">{{itemForm.diningTypeFormat}}</view>
								<view v-else-if="tabval == 'billRef'">{{$t('order.checkout_order')}}</view>
								<view v-else-if="tabval == 'integralRef'">{{$t('order.points_mall')}}</view>
								<view v-else>{{itemForm.orderTypeFormat}}</view>
								<view class="line"></view>
								<view class="pr20">{{itemForm.stateFormat || '-'}}</view>
							</view>
							<view v-if="itemForm.scene == 1 && itemForm.state >= 2 && itemForm.deliveryOrder">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="seePs(itemForm)">{{$t('order.delivery_info')}}</u-button>
							</view>
						</view>
						<view class="mt10" v-if="itemForm.pickNo">
							{{$t('order.serial_number')}}：{{itemForm.pickNo}}
						</view>
						<view class="mt10 bbae6 pb10">
							<view class="flex" v-if="itemForm.admin">
								<view>{{$t('order.order_person')}}：</view>
								<view class="flex">
									<view>{{itemForm.admin && itemForm.admin.nickname || '-'}}-</view>
									<view>{{itemForm.admin && itemForm.admin.mobile}}</view>
								</view>
							</view>
							<view class="flex mt10" v-if="itemForm.user">
								<view>{{$t('order.user_info')}}：</view>
								<view class="flex">
									<view>{{itemForm.user && itemForm.user.nickname || '-'}}-</view>
									<view>{{itemForm.user && itemForm.user.mobile}}</view>
								</view>
							</view>
							<view v-if="itemForm.scene == 1 && itemForm.state >= 2 && itemForm.address">
								<view class="flex mt10">
									<view class="fg0">{{$t('order.delivery_address')}}：</view>
									<view>
										<text>{{itemForm.address.address}}</text>
										<text>{{itemForm.address.description}}</text>
									</view>
								</view>
								<view class="flex mt10">
									<view class="fg0">{{$t('order.recipient')}}：</view>
									<view>{{itemForm.address.contact}}<text
											class="ml10">{{itemForm.address.mobile}}</text></view>
								</view>
							</view>
							<view class="mt20 tit f-bt bbae6 pb10">
								<view class="c9">{{$t('order.payment_info')}}</view>
								<view style="color: #4275F4;">
									{{itemForm.orderIndex && itemForm.orderIndex.payStateFormat}}
								</view>
							</view>
							<view class="f-bt mt10" v-if="itemForm.goodsSellMoney>0">
								<view class="">{{$t('order.total_product_amount')}}：</view>
								<view>฿{{itemForm.goodsSellMoney}}</view>
							</view>
							<view class="f-bt mt10" v-if="itemForm.boxMoney>0">
								<view class="">{{$t('order.packaging_fee')}}：</view>
								<view>฿{{itemForm.boxMoney}}</view>
							</view>
							<view class="f-bt mt10" v-if="itemForm.deliveryMoney && tabval != 'integralRef'">
								<view class="">{{$t('order.delivery_fee')}}：</view>
								<view>฿{{itemForm.deliveryMoney}}</view>
							</view>
							<view class="f-bt mt10" v-if="itemForm.tableMoney>0">
								<view class="">{{itemForm.tableFormat || $t('order.service_charge')}}：</view>
								<view>฿{{itemForm.tableMoney}}</view>
							</view>
						

						<!-- 	<view class="f-bt mt10" v-if="itemForm.taxIncluded>0">
								<view class="">{{$t('pay-components.taxIncluded')}}：</view>
								<view>฿{{itemForm.taxIncluded}}</view>
							</view> -->
<!-- 
							<view class="f-bt mt10" v-if="itemForm.vatMoney>0">
								<view class="">{{$t('pay-components.totaltax')}}：</view>
								<view>฿{{ (Number(itemForm.taxIncluded) + Number(itemForm.vatMoney)).toFixed(2)}}</view>
							</view> -->

							<view class="f-bt mt10" v-if="itemForm.serviceMoney>0">
								<view class="">
									{{$t('pay-components.serviceMoney')}}({{ (itemForm.serviceValue * 100).toFixed(0) }}%)：
								</view>
								<view>฿{{itemForm.serviceMoney}}</view>
							</view>
				
							<view class="f-bt wei mt15 f18" v-if="tabval == 'integralRef'">
								<view>{{$t('order.order_amount')}}</view>
								<view class="t-o-e" v-if="itemForm.goods">
									<text v-if="itemForm.goods.integral>0">{{itemForm.goods.integral}}</text>
									<text v-if="itemForm.goods.integral>0" class="f13 nowei">积分</text>
									<text v-if="itemForm.goods.integral>0 && itemForm.goods.money>0"
										class="nowei">+</text>
									<text v-if="itemForm.goods.money>0"><text
											class="f12">฿</text>{{itemForm.goods.money}}</text>
								</view>
							</view>
							<view class="f-bt wei mt15 f18" v-else>
								<view>{{$t('order.order_amount')}}</view>
								<view>฿{{tabval == 'valueRef' ? itemForm.money : itemForm.money}}</view>
							</view>
						</view>
						<view class="mt15 bbae6 pb15" v-if="tabval != 'integralRef'">
							<!-- <view v-if="itemForm.discounts">
								<view class="f-bt mt10" v-if="itemForm.discounts.fullsub">
									<view class="">满减：</view>
									<view>-฿{{itemForm.discounts.fullsub.money}}</view>
								</view>
								<view class="f-bt mt10" v-if="itemForm.discounts.newSub">
									<view class="">新客立减：</view>
									<view>-฿{{itemForm.discounts.newSub.money}}</view>
								</view>
								<view class="f-bt mt10" v-if="itemForm.discounts.coupon">
									<view class="">优惠券：</view>
									<view>-฿{{itemForm.discounts.coupon.money}}</view>
								</view>
								<view class="f-bt mt10" v-if="itemForm.discounts.deliveryCoupon">
									<view class="">配送券：</view>
									<view>-฿{{itemForm.discounts.deliveryCoupon.money}}</view>
								</view>
							</view> -->
							<view v-if="itemForm.discountsPlus">
								<view class="f-bt mt10" v-for="(v,i) in itemForm.discountsPlus" :key="i">
									<view class="">{{v.activityName}}：</view>
									<view>-฿{{v.money}}</view>
								</view>
							</view>
							<view class="f-bt wei f18 mt10">
								<view>{{$t('order.total_discount')}}</view>
								<view>฿{{itemForm.discountMoney || 0}}</view>
							</view>
						</view>
						<view class="mt15 bbae6 pb15">
							<view
								v-if="itemForm.orderIndex && itemForm.orderIndex.orderPay && itemForm.orderIndex.orderPay.length">
								<view class="f-bt mt10" v-for="(v,i) in itemForm.orderIndex.orderPay" :key="i">
									<view class="">{{v.payTypeFormat}}</view>
									<view><text v-if="v.payType==9">-</text>฿{{v.money}}</view>
								</view>
							</view>
							<block v-else>
								<view v-if="itemForm.orderIndex">
									<view class="f-bt mt10">
										<view class="">{{itemForm.orderIndex.payTypeFormat}}</view>
										<view>฿{{itemForm.money}}</view>
									</view>
								</view>
							</block>
							<view class="f-bt wei f18 mt10">
								<view>{{$t('order.total_payment')}}</view>
								<view>฿{{itemForm.money}}</view>
							</view>
							 
							
							<view class="f-bt mt10" v-if="itemForm.taxIncluded>0">
								<view class="">{{$t('pay-components.taxIncluded')}}：</view>
								<view>฿{{itemForm.taxIncluded}}</view>
							</view>
						</view>
						<!-- <view class="mt15 bbae6 pb15">
							<view class="f-bt wei f20">
								<view>支付优惠</view>
								<view>฿0</view>
							</view>
						</view> -->
						<view class="mt15 pb15" v-if="tabval != 'integralRef'">
							<view v-if="itemForm.orderIndex">
								<view class="f-bt mt10">
									<view class="">{{$t('order.order_commission')}}</view>
									<view>฿0</view>
								</view>
							</view>
							<view class="f-bt wei f18 mt10">
								<view>{{$t('order.expected_income')}}</view>
								<view style="color: #4275F4;" v-if="itemForm.state==8">
									฿{{itemForm.money - itemForm.refundMoney}}</view>
								<view style="color: #4275F4;" v-else>฿{{itemForm.money}}</view>
							</view>
							
						</view>
					</view>
					<view class="f-g-0 flex p15 f-x-e btn">
						<block v-if="tabval == 'selfRef' || tabval == 'sideRef'">
							<view class="f-g-1 mr10" v-if="itemForm.state == 1">
								<u-button size="small" :customStyle="{color:'#000',height:'40px',fontSize:14}"
									type="warning" @click="opClick('cancel')">{{$t('order.cancel_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('receiving')">{{$t('order.accept_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button size="small" :customStyle="{color:'#fff',height:'40px',fontSize:14}"
									type="error" @click="opClick('refOrder')">{{$t('order.reject_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 3">
								<u-button size="small" :customStyle="{color:'#fff',height:'40px',fontSize:14}"
									type="success"
									@click="opClick('makeding')">{{$t('order.order_complete')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="tabval == 'selfRef' && itemForm.state == 4">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('completeing')">{{$t('order.confirm_pickup')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="tabval == 'sideRef' && itemForm.state == 4">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('gotoPs')">{{$t('order.initiate_delivery')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.scene == 1 && itemForm.state == 5">
								<u-button size="small" color="#4275F4"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('completeOrder')">{{$t('order.complete_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10"
								v-if="itemForm.state > 2 && itemForm.state < 7 && itemForm.orderIndex && itemForm.orderIndex.state!=10">
								<u-button size="small" color="#F74A33"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="error"
									@click="opClick('refund')">{{$t('order.refund')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 7">
								<u-button size="small" color="#F74A33"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="error"
									@click="opClick('refound')">{{$t('order.agree_refund')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state >= 1">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true"
									@click="opClick('gotoRemark')">{{$t('order.merchant_remark')}}</u-button>
							</view>
							<view class="f-g-1 p-r" v-if="itemForm.state >= 2 && itemForm.state < 8">
								<u-button size="small" type="primary" :plain="true"
									:customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									@click="outShow = !outShow">{{$t('order.print_order')}}</u-button>
								<view class="dayin p10 bf f16" v-if="outShow">
									<view class="item pb10" @click="opClick('inOrderPrint',15)">
										{{$t('order.merchant_copy')}}
									</view>
									<view class="item pb10 pt10" @click="opClick('inOrderPrint',16)">
										{{$t('order.customer_copy')}}
									</view>
									<view class="item pb10 pt10" @click="opClick('inOrderPrint',17)">
										{{$t('order.total_production_order')}}
									</view>
									<view class="item pt10 ib" @click="opClick('inOrderPrint',18)">
										{{$t('order.sub_production_order')}}
									</view>
								</view>
							</view>
						</block>
						<block v-if="tabval == 'inStoreRef'">
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('inReceiving')">{{$t('order.accept_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button size="small" :customStyle="{color:'#fff',height:'40px',fontSize:14}"
									type="error" @click="opClick('inCanceling')">{{$t('order.reject_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10"
								v-if="itemForm.state == 3 && (itemForm.diningType == 5 || itemForm.diningType == 6)">
								<u-button size="small" :customStyle="{color:'#fff',height:'40px',fontSize:14}"
									type="success"
									@click="opClick('inMakeding')">{{$t('order.order_complete')}}</u-button>
							</view>
							<view class="f-g-1 mr10"
								v-if="itemForm.state == 4 && (itemForm.diningType == 6 || itemForm.diningType == 5)">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('callOrder')">{{$t('order.call_number')}}</u-button>
							</view>
							<view class="f-g-1 mr10"
								v-if="itemForm.isPay == 1 && itemForm.state > 2 && itemForm.state < 7 && itemForm.orderIndex && itemForm.orderIndex.state!=10">
								<u-button size="small" color="#F74A33"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="error"
									@click="opClick('inRefunding')">{{$t('order.refund')}}</u-button>
							</view>
							<view class="f-g-1 mr10"
								v-if="itemForm.state == 4 && (itemForm.diningType == 6 || itemForm.diningType == 5)">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('inCompleteOrder')">{{$t('order.complete_order')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state >= 1">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true"
									@click="opClick('gotoRemark')">{{$t('order.merchant_remark')}}</u-button>
							</view>
							<view class="f-g-1 p-r" v-if="itemForm.state >= 2 && itemForm.state < 8">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true"
									@click="inpShow = !inpShow">{{$t('order.print_order')}}</u-button>
								<view class="dayin p10 bf f16" v-if="inpShow">
									<view class="item pb10" @click="opClick('inOrderPrint',3)">
										{{$t('order.billing_statement')}}
									</view>
									<view class="item pb10 pt10" @click="opClick('inOrderPrint',7)">
										{{$t('order.customer_order')}}
									</view>
									<view class="item pb10 pt10" @click="opClick('inOrderPrint',6)">
										{{$t('order.pre_bill')}}
									</view>
									<view class="item pb10 pt10" @click="opClick('inOrderPrint',13)">
										{{$t('order.total_production_order')}}
									</view>
									<view class="item pt10 ib" @click="opClick('inOrderPrint',14)">
										{{$t('order.sub_production_order')}}
									</view>
								</view>
							</view>
						</block>
						<block v-if="tabval == 'billRef'">
							<view class="f-g-1 mr10" v-if="itemForm.state==6">
								<u-button size="small" color="#F74A33"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="error"
									@click="opClick('billRefunding')">{{$t('order.refund')}}</u-button>
							</view>
							<view class="f-g-1">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true"
									@click="opClick('billOrderPrint')">{{$t('order.print_order')}}</u-button>
							</view>
						</block>
						<block v-if="tabval == 'valueRef'">
							<view class="f-g-1">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true"
									@click="opClick('valueOrderPrint')">{{$t('order.print_order')}}</u-button>
							</view>
						</block>
						<block v-if="tabval == 'integralRef'">
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('integralSmhx')">{{$t('order.scan_to_redeem')}}</u-button>
							</view>
							<view class="f-g-1 mr10" v-if="itemForm.state == 2">
								<u-button color="#4275F4" size="small"
									:customStyle="{color:'#fff',height:'40px',fontSize:14}" type="primary"
									@click="opClick('integralSdhx')">{{$t('order.manual_redeem')}}</u-button>
							</view>
							<!-- <view class="f-g-1">
								<u-button size="small" :customStyle="{color:'#4275F4',height:'40px',fontSize:14}"
									type="primary" :plain="true" @click="opClick('integralPrint')">打印订单</u-button>
							</view> -->
						</block>
					</view>
				</view>
			</view>
		</view>
		<!-- <view v-else class="f-1 f-c-c" style="overflow-y:auto">
			<u-empty mode="order" :icon="'@/static/imgs/data.png'"></u-empty>
		</view> -->
		<empty v-else :txt="$t('order.no_orders')" t="dd" />
		<u-modal :show="show" :showCancelButton="true" width="250px" title=" " :cancelText="$t('modal.cancelText')"
			:confirmText="$t('modal.confirmText')" :content='showMsg' @confirm="confirm" @cancel="show=false"
			confirmColor="#fff"></u-modal>
		<remarkMask ref="remarkMaskRef" @itemRemark="itemRemark"></remarkMask>
		<hexiaoMask ref="hexiaoMaskRef" @itemRemark="hexiao"></hexiaoMask>
		<psChannel ref="psChannelRef" @handPsChannel="handPsChannel"></psChannel>
		<psDl ref="psDlRef"></psDl>
	</view>
</template>

<script>
	import remarkMask from './order/remarkMask.vue';
	import psChannel from './order/psChannel.vue';
	import psDl from './order/psDl.vue';
	import empty from '@/components/other/empty.vue';
	import hexiaoMask from './order/hexiaoMask.vue';
	import {
		fuzhi,
	} from "@/common/handutil.js"
	export default ({
		components: {
			remarkMask,
			psChannel,
			psDl,
			empty,
			hexiaoMask,
		},
		data() {
			return {
				list1: [{
					name: this.$t('order.pickup_order'),
					value: 'selfRef',
				}, {
					name: this.$t('order.delivery_order'),
					value: 'sideRef',
				}, {
					name: this.$t('order.in_store_order'),
					value: 'inStoreRef',
				}, {
					name: this.$t('order.checkout_order'),
					value: 'billRef',
				}, {
					name: this.$t('order.stored_value_order'),
					value: 'valueRef',
				}],
				current: 0,

				tabval: 'inStoreRef',
				// tab2: 0,
				// isItem: 0,
				tabs: [this.$t('order.takeaway'), this.$t('order.in_store_dining'), this.$t('order.cashier'), this.$t(
					'order.stored_value')],
				tabs2: [this.$t('order.basic_info'), this.$t('order.product_info'), this.$t('order.order_log')],
				list: [],
				itemForm: {},

				pageUrl: this.api.inStoreOrder,
				queryForm: {
					keyword: "",
					userKeyword: "",
					state: "",
					scene: 2,
					pageNo: 1,
					pageSize: 10,
					appointment: '',
					payType: '',
					timeType: 2,
					timeChannel: 'created_at',
				},
				total: 0,
				orderList: [],
				show: false,
				showMsg: '',
				channels: [{
						value: '',
						text: this.$t('order.all_types')
					},
					{
						value: 'instant',
						text: this.$t('order.instant_order')
					},
					{
						value: 'appointment',
						text: this.$t('order.reservation_order')
					}
				],
				states: [{
						value: '',
						text:this.$t('order.statedefault')
					},
					{
						value: 'close',
						text: this.$t('order.close')
					},
					{
						value: 'refund',
						text: this.$t('order.refund')
					}
				],
				classfiy: [{
						value: '',
						text: this.$t('order.all_methods')
					},
					{
						value: 'BankTransfer',
						text: 'BankTransfer'
					},
					{
						value: 'cash',
						text: 'Cash'
					},
					{
						value: 'PromptPay',
						text: 'PromptPay'
					},
					{
						value: 'wexin',
						text: this.$t('order.wechat_pay')
					},
					{
						value: 'ali',
						text: this.$t('order.alipay')
					},
					{
						value: 'balance',
						text: this.$t('order.balance_pay')
					},
				],
				classfiys: [{
						value: '',
						text: this.$t('order.all_methods')
					},
					{
						value: 'BankTransfer',
						text: 'BankTransfer'
					},
					{
						value: 'PromptPay',
						text: 'PromptPay'
					},
					{
						value: 'wexin',
						text: this.$t('order.wechat_pay')
					},
					{
						value: 'ali',
						text: this.$t('order.alipay')
					},
					{
						value: 'balance',
						text: this.$t('order.balance_pay')
					},
					{
						value: 'cash',
						text: this.$t('order.cash_pay')
					},
				],
				dates: [{
						value: 2,
						text: this.$t('order.today')
					},
					{
						value: -1,
						text: this.$t('order.yesterday')
					},
					{
						value: 7,
						text: `7${this.$t('order.within_days')}`,
					}
				],
				dateTime: [{
						value: 'created_at',
						text: this.$t('order.order_time')
					},
					{
						value: 'payTime',
						text: this.$t('order.payment_time')
					},
					{
						value: 'completionTime',
						text: this.$t('order.completion_time')
					}
				],
				inpShow: false,
				outShow: false,
			}
		},
		methods: {
			init() {
				//this.getWays()
				this.fetchData()
				this.getSetInfo()
			},
			async getSetInfo() {
				let {
					data
				} = await this.beg.request({
					url: this.api.systemConfig
				})
				uni.setStorageSync('setInfo', data)
			},
			async getWays() {
				let {
					data
				} = await this.beg.request({
					url: this.api.costomPay
				})
				let way = []
				way = data.map(v => ({
					text: v.name,
					value: v.id,
				}))
				this.classfiys = this.classfiys.concat(way)
				this.classfiy = this.classfiy.concat(way)

			},
			async fetchData() {
				let {
					data: {
						list,
						pageNo,
						pageSize,
						total
					},
				} = await this.beg.request({
					url: this.pageUrl,
					data: this.queryForm,
					mask:1,
				})
				this.orderList = list ? list : []
				this.total = total
				if (list && list.length) {
					if (this.tabval == 'selfRef' || this.tabval == 'sideRef' || this.tabval == 'inStoreRef') {
						this.isItem = list[0].id
						this.orderDl(this.tabval == 'selfRef' || this.tabval == 'sideRef' ? list[0].id : list[0]
							.orderSn)
					} else {
						this.isItem = list[0].id
						this.itemForm = list[0]
					}
				} else {
					this.itemForm = {}
				}
			},
			handDiningType(e) {
				this.queryForm.appointment = e
				this.fetchData()
			},
			handstate(e) {
				this.queryForm.state = e
				this.fetchData()
			},
			handSource(e) {
				this.queryForm.payType = e
				this.fetchData()
			},
			handDate(e) {
				this.queryForm.timeType = e
				this.fetchData()
			},
			handChannel(e) {
				this.queryForm.timeChannel = e
				this.fetchData()
			},
			change(e) {
				this.queryForm.pageNo = e.current;
				this.fetchData()
			},
			handTabs(e) {
				console.log(e)
				this.orderList =[];
				this.queryForm.pageNo = 1
				this.queryForm.appointment = ''
				this.queryForm.payType = ''
				this.queryForm.timeType = 2
				this.queryForm.timeChannel = 'created_at'
				this.tabval = e.value
				if (e.value == 'selfRef') {
					this.queryForm.scene = 2
					this.pageUrl = this.api.orderList
				} else if (e.value == 'sideRef') {
					this.queryForm.scene = 1
					this.pageUrl = this.api.orderList
				} else if (e.value == 'inStoreRef') {
					this.queryForm.scene = 3
					this.pageUrl = this.api.inStoreOrder
				} else if (e.value == 'billRef') {
					this.pageUrl = this.api.personPay
				} else if (e.value == 'valueRef') {
					this.pageUrl = this.api.storedValueOrder
				} else if (e.value == 'integralRef') {
					this.queryForm.scene = 4
					this.pageUrl = this.api.pointsMallOrder
				}
				this.fetchData()
				this.outShow = false
				this.inpShow = false
			},
			async itemRemark(e) {
				let {
					data,
					msg
				} = await this.beg.request({
					url: `${this.itemForm.scene>2 ? this.api.inNotes : this.api.oNotes}/${this.itemForm.id}`,
					method: "POST",
					data: {
						notes: e
					},
				})
				uni.$u.toast(msg)
				this.orderDl(this.tabval == 'selfRef' || this.tabval == 'sideRef' ? this.itemForm.id : this
					.itemForm.orderSn)
				this.$refs['remarkMaskRef'].close()
			},
			handPsChannel() {
				this.orderDl(this.tabval == 'selfRef' || this.tabval == 'sideRef' ? this.itemForm.id : this.itemForm
					.orderSn)
			},

			clickItem(item, index) {
				this.isItem = item.id
				this.current = index
				if (this.tabval == 'selfRef' || this.tabval == 'sideRef' || this.tabval == 'inStoreRef') {
					this.orderDl(this.tabval == 'selfRef' || this.tabval == 'sideRef' ? item.id : item.orderSn)
				} else {
					this.itemForm = item
				}
			},
			async orderDl(i) {
				let {
					data
				} = await this.beg.request({
					url: `${this.tabval == 'inStoreRef' ? this.api.inStoreOrder : this.api.orderList}/${i}`
				})
				this.itemForm = data
				if (this.tabval == 'inStoreRef' && data.diningType == 6) {
					this.itemForm.goods = data.goods
				} else if (this.tabval == 'selfRef' || this.tabval == 'sideRef') {
					this.itemForm.goods = data.subGoods && data.subGoods.length && data.subGoods || data.goods
						.length && data.goods
				}
			},
			opClick(v, t) {
				this.showType = v
				switch (v) {
					case "cancel":
						this.showMsg = this.$t('order.confirm_cancel_order')
						this.show = true
						break;
					case "receiving":
						this.showMsg = this.$t('order.confirm_accept_order')
						this.show = true
						break;
					case "refOrder":
						this.showMsg = this.$t('order.confirm_reject_order')
						this.show = true
						break;
					case "makeding":
						this.showMsg = this.$t('order.confirm_order_complete')
						this.show = true
						break;
					case "completeing":
						this.showMsg = this.$t('order.confirm_pickup')
						this.show = true
						break;
					case "refound":
						this.showMsg = this.$t('order.confirm_agree_refund')
						this.show = true
						break;
					case "refund":
						this.showMsg = this.$t('order.confirm_refund')
						this.show = true
						break;
					case "refuse":
						this.showMsg = this.$t('order.confirm_reject_refund')
						this.show = true
						break;
					case "completeOrder":
						this.showMsg = this.$t('order.confirm_complete_order')
						this.show = true
						break;
					case "gotoPs":
						this.$refs['psChannelRef'].open(this.itemForm)
						break;
					case "print":
						this.handRequest(this.itemForm, 'printOrder');
						break;
					case "gotoRemark":
						this.$refs['remarkMaskRef'].open(this.itemForm)
						break;
					case "inReceiving":
						this.showMsg = this.$t('order.confirm_accept_order')
						this.show = true
						break;
					case "inCanceling":
						this.showMsg = this.$t('order.confirm_reject_order')
						this.show = true
						break;
					case "inMakeding":
						this.showMsg = this.$t('order.confirm_order_complete')
						this.show = true
						break;
					case "callOrder":
						this.handRequest(this.itemForm, 'callNum');
						break;
					case "inRefunding":
						this.showMsg = this.$t('order.confirm_refund')
						this.show = true
						break;
					case "inCompleteOrder":
						this.showMsg = this.$t('order.confirm_complete_order')
						this.show = true
						break;
					case "inOrderPrint":
						this.handInOrderPrint(this.itemForm, 'printOrder', t);
						this.inpShow = false
						this.outShow = false
						break;
					case "billRefunding":
						this.showMsg = this.$t('order.confirm_refund')
						this.show = true
						break;
					case "billOrderPrint":
						this.handInOrderPrint(this.itemForm, 'printOrder', 4);
						break;
					case "valueOrderPrint":
						this.handInOrderPrint(this.itemForm, 'printOrder', 5);
						break;
					case "integralPrint":
						this.handInOrderPrint(this.itemForm, 'printOrder', 6);
						break;
					case "integralSmhx":
						var that = this
						uni.scanCode({
							onlyFromCamera: true,
							success: function(res) {
								if (res.result) {
									that.hexiao(res.result, this.itemForm)
								}
							}
						});
						break;
					case "integralSdhx":
						this.$refs['hexiaoMaskRef'].open(this.itemForm)
						break;
					default:
						break;
				}
			},
			async confirm(e) {
				switch (this.showType) {
					case "cancel":
						this.handRequest(this.itemForm, 'oClose');
						break;
					case "receiving":
						this.handRequest(this.itemForm, 'receiving');
						break;
					case "refOrder":
						this.handRequest(this.itemForm, 'refund');
						break;
					case "makeding":
						this.handRequest(this.itemForm, 'maked');
						break;
					case "completeing":
						this.handRequest(this.itemForm, 'complete');
						break;
					case "refound":
						this.handRequest(this.itemForm, 'refund');
						break;
					case "refund":
						this.handRequest(this.itemForm, 'refund');
						break;
					case "refuse":
						this.handRequest(this.itemForm, 'reject');
						break;
					case "completeOrder":
						this.handRequest(this.itemForm, 'complete');
						break;
					case "inReceiving":
						this.handRequest(this.itemForm, 'inStoreReceived');
						break;
					case "inCanceling":
						this.handRequest(this.itemForm, 'inOClose');
						break;
					case "inMakeding":
						this.handRequest(this.itemForm, 'inStoreMaked');
						break;
					case "inRefunding":
						this.handRequest(this.itemForm, 'inRefund');
						break;
					case "inCompleteOrder":
						this.handRequest(this.itemForm, 'inStoreComplete');
						break;
					case "billRefunding":
						this.handOrderSn(this.itemForm, 'ppRefund');
						break;

				}
			},
			async hexiao(i, v) {
				let {
					data,
					msg,
				} = await this.beg.request({
					url: `${this.api.pointVerification}/${v.orderSn}`,
					method: 'POST',
					data: {
						code: i
					}
				})
				uni.$u.toast(msg)
				this.fetchData()
				this.$refs['hexiaoMaskRef'].close()
			},
			async handRequest(v, a) {
				let {
					data,
					msg
				} = await this.beg.request({
					url: `${this.api[a]}/${v.id}`,
					method: "POST",
					data: {
						storeId: v.storeId
					},
				})
				this.show = false
				uni.$u.toast(msg)
				this.fetchData()
			},
			async handOrderSn(v, a) {
				let {
					data,
					msg
				} = await this.beg.request({
					url: `${this.api[a]}/${v.orderSn}`,
					method: "POST",
					data: {
						storeId: v.storeId
					},
				})
				this.show = false
				uni.$u.toast(msg)
				this.fetchData()
			},
			async handInOrderPrint(v, a, t) {
				let {
					data,
					msg
				} = await this.beg.request({
					url: `${this.api[a]}/${v.id}`,
					method: "POST",
					data: {
						storeId: v.storeId,
						scene: t,
					},
				})
				uni.$u.toast(msg)
				this.fetchData()
			},
			handFz(n) {
				fuzhi(n)
			},
			seePs(v) {
				this.$refs['psDlRef'].open(v)
			},
		}
	})
</script>

<style lang="scss" scoped>
	.main {
		.left {
			width: 29.2825vw;

			.lwrap {
				// height: 74.5098vh;
				max-height: calc(100vh - 190px);
				overflow: hidden;
				overflow-y: scroll;

				.list {
					background: #fff;
					border: 2px solid #EBEAF0;
					border-left: 6px solid #4275F4;
					border-radius: 10px;
				}

				.lcur {
					background: #E3EDFE;
					border: 2px solid #4275F4;
					border-left: 6px solid #4275F4;
				}
			}
		}

		.right {
			.goods {
				width: 27.8184vw;
				// height: 80.0312vh;
				max-height: calc(100vh - 190px);
				overflow: hidden;
				overflow-y: scroll;
				border: 1px solid #e6e6e6;
			}

			.order {
				// height: 71.6145vh;
				max-height: calc(100vh - 190px);
				overflow: hidden;
				overflow-y: scroll;
				border: 1px solid #e6e6e6;

				.fg0 {
					width: 5.8565vw;
				}

				.tit {
					// background: #e6e6e6;
				}
			}
		}

		.bbae6 {
			border-bottom: 2px dotted #e6e6e6;
		}

		.line {
			width: 2px;
			height: 18px;
			margin: 0 10px;
			background: #e6e6e6;
		}

	}

	.l_bot {
		border-top: 1px solid #ddd;
		white-space: nowrap;
		overflow: hidden;
		overflow-x: scroll;
	}

	/deep/.uni-pagination {
		.page--active {
			// display: inline-block;
			// width: 2.1961vw;
			// height: 2.1961vw;
			background: #4275F4 !important;
			color: #fff !important;
		}

		// .is-phone-hide {
		// 	width: 2.1961vw;
		// 	height: 2.1961vw;
		// }

		// .uni-pagination__total {
		// 	font-size: 1.3177vw;
		// 	width: auto;
		// 	display: -webkit-box;
		// 	display: -webkit-flex;
		// 	display: flex;
		// 	align-items: center;
		// }

		// span {
		// 	font-size: 1.3177vw;
		// }
	}

	.btn {
		box-shadow: 0px 0px 10px 0px #e6e6e6;
	}

	.u-button--warning {
		background-color: #4275F4;
		border-color: #4275F4;
	}

	.u-popup {
		flex: 0;
	}

	.search {
		.sw {
			width: 8.7847vw;
		}

		.iw {
			width: 14.6412vw;
		}

		/deep/.u-form {
			display: flex !important;
			// overflow-x: scroll;
			flex-wrap: wrap;

			.u-input {
				background: #fff;

				.input-placeholder,
				.uni-input-input {
					font-size: 16px;
				}
			}

			.uni-select {
				height: 38px !important;
				background: #fff;

				.uni-select__input-placeholder {
					font-size: 16px !important;
					color: #ccc;
				}

				.uni-select__selector-item {
					span {
						font-size: 16px;
					}
				}
			}
		}
	}

	.i_tag {
		padding: 0 0.2196vw;
		border: 1px solid #FD8906;
		border-radius: 3px;
		background: #fff9ec;
	}

	.i_tag2 {
		background: #3E77B9;
		border: 1px solid #3E77B9;
	}

	.dayin {
		width: 100%;
		position: absolute;
		bottom: 50px;
		left: 0;
		box-shadow: 0px 0px 10px 0px #e6e6e6;

		.item {
			border-bottom: 1px solid #e6e6e6;
			cursor: pointer;
		}

		.ib {
			border-bottom: none;
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.main {
			.left {
				width: 400px;

				.lwrap {
					// height: 570px;
					max-height: calc(100vh - 190px);
				}
			}

			.right {
				.goods {
					max-height: calc(100vh - 190px);
					width: 380px;
					height: auto;
				}

				.order {
					max-height: calc(100vh - 190px);
					// height: 550px;
				}
			}
		}

		.search {
			.sw {
				width: 120px;
			}

			.iw {
				width: 200px;
			}
		}
	}
</style>