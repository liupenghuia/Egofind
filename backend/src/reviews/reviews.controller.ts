import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: '互评' })
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateReviewDto) {
    return this.service.create(user.id, dto);
  }

  @Get('by-match/:matchOrderId')
  @ApiOperation({ summary: '本单评价列表（仅参与者）' })
  listByMatch(
    @CurrentUser() user: JwtPayloadUser,
    @Param('matchOrderId') matchOrderId: string,
  ) {
    return this.service.listByMatch(user.id, matchOrderId);
  }
}
